
import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------
// ⚡ CONFIGURAÇÃO DO SUPABASE
// -----------------------------------------------------------
const supabaseUrl: string = 'https://kndyaebbovxegvnfdjfb.supabase.co'; 
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZHlhZWJib3Z4ZWd2bmZkamZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTg0ODYsImV4cCI6MjA4MjY5NDQ4Nn0.Y1krXCgUVSQhTv5LtCwV7Frt0hRJwscBkFmbIRTY_dI'; 

// -----------------------------------------------------------

const isValidKey = !!(supabaseKey && supabaseKey.startsWith('eyJ'));
const isValidUrl = !!(supabaseUrl && supabaseUrl.startsWith('https'));

export const isConfigured = isValidUrl && isValidKey;

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
}) : null;

// Função de diagnóstico para o modal de setup
export const checkTablesConnection = async () => {
    if (!supabase) return { success: false, message: 'Supabase não configurado' };
    
    try {
        const results = await Promise.allSettled([
            supabase.from('orders').select('id').limit(1),
            supabase.from('subscribers').select('id').limit(1),
            supabase.from('resellers').select('id').limit(1)
        ]);

        const tables = ['orders', 'subscribers', 'resellers'];
        const missing = results
            .map((res, i) => (res.status === 'rejected' || (res.status === 'fulfilled' && res.value.error)) ? tables[i] : null)
            .filter(Boolean);

        if (missing.length === 0) {
            return { success: true, message: 'Todas as tabelas foram encontradas!' };
        } else {
            return { success: false, message: `Tabelas ausentes: ${missing.join(', ')}` };
        }
    } catch (e) {
        return { success: false, message: 'Erro de conexão com o banco.' };
    }
};

const handleSupabaseError = (error: any, context: string) => {
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';

    const isTableOrPermissionError = 
        errorCode === 'PGRST205' || 
        errorCode === '42P01' || 
        errorCode === '42501' || 
        (errorMessage && (
            errorMessage.includes('Could not find the table') || 
            errorMessage.includes('does not exist') || 
            errorMessage.includes('relation') ||
            errorMessage.includes('permission denied') ||
            errorMessage.includes('row-level security')
        ));

    if (isTableOrPermissionError) {
        console.warn(`[Supabase Setup Info] Tabela ou permissão pendente de configuração em [${context}].`);
        window.dispatchEvent(new CustomEvent('supabase_table_missing', { detail: { context, error } }));
    } else {
        console.warn(`[Supabase Connection Alert] Falha ao sincronizar [${context}]:`, errorMessage || error);
    }
};

// --- FUNÇÕES DE PEDIDOS (ORDERS) ---

export const saveOrderToCloud = async (orderData: any) => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('orders').insert([{
            id: orderData.id,
            short_id: orderData.shortId,
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone,
            items: orderData.items,
            total: orderData.total,
            status: orderData.status,
            created_at: orderData.createdAt,
            reseller: orderData.reseller,
            observations: orderData.observations
        }]);
        if (error) { handleSupabaseError(error, 'SaveOrder'); return false; }
        return true;
    } catch (e) { return false; }
};

export const subscribeToOrders = (callback: (orders: any[]) => void) => {
    if (!supabase) return () => {};
    const fetchOrders = async () => {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) { handleSupabaseError(error, 'FetchOrders'); return; }
        if (data) callback(data.map(o => ({ ...o, shortId: o.short_id, customerName: o.customer_name, customerPhone: o.customer_phone })));
    };
    fetchOrders();
    const channel = supabase.channel('orders_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const updateOrderStatusInCloud = async (orderId: string, newStatus: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) handleSupabaseError(error, 'UpdateStatus');
};

export const deleteOrderInCloud = async (orderId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) handleSupabaseError(error, 'DeleteOrder');
};

// --- FUNÇÕES DE ASSINANTES (SUBSCRIBERS) ---

export const saveSubscriberToCloud = async (subscriberData: any) => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('subscribers').insert([{
            id: subscriberData.id,
            name: subscriberData.name,
            access_key: subscriberData.accessKey,
            type: subscriberData.type,
            credits: subscriberData.credits,
            is_active: subscriberData.isActive,
            valid_until: subscriberData.validUntil,
            created_at: subscriberData.createdAt,
            reseller: subscriberData.reseller
        }]);
        if (error) { handleSupabaseError(error, 'SaveSubscriber'); return false; }
        return true;
    } catch (e) { return false; }
};

export const subscribeToSubscribers = (callback: (subs: any[]) => void) => {
    if (!supabase) return () => {};
    const fetchSubs = async () => {
        const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
        if (error) { handleSupabaseError(error, 'FetchSubs'); return; }
        if (data) callback(data.map(s => ({ ...s, accessKey: s.access_key, isActive: s.is_active, validUntil: s.valid_until })));
    };
    fetchSubs();
    const channel = supabase.channel('subs_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, () => fetchSubs()).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const updateSubscriberInCloud = async (subId: string, data: any) => {
    if (!supabase) return;
    const updates: any = {};
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    if (data.credits !== undefined) updates.credits = data.credits;
    if (data.name !== undefined) updates.name = data.name;
    const { error } = await supabase.from('subscribers').update(updates).eq('id', subId);
    if (error) handleSupabaseError(error, 'UpdateSub');
};

export const deleteSubscriberInCloud = async (subId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('subscribers').delete().eq('id', subId);
    if (error) handleSupabaseError(error, 'DeleteSub');
};

// --- FUNÇÕES DE REVENDEDORES (RESELLERS) ---

export const saveResellerToCloud = async (resellerData: any) => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('resellers').insert([{
            id: resellerData.id,
            name: resellerData.name,
            phone: resellerData.phone,
            doc: resellerData.doc,
            city: resellerData.city,
            pix_key: resellerData.pixKey,
            created_at: resellerData.createdAt
        }]);
        if (error) { handleSupabaseError(error, 'SaveReseller'); return false; }
        return true;
    } catch (e) { return false; }
};

export const subscribeToResellers = (callback: (resellers: any[]) => void) => {
    if (!supabase) return () => {};
    const fetchResellers = async () => {
        const { data, error } = await supabase.from('resellers').select('*').order('created_at', { ascending: false });
        if (error) { handleSupabaseError(error, 'FetchResellers'); return; }
        if (data) callback(data.map(r => ({ ...r, pixKey: r.pix_key })));
    };
    fetchResellers();
    const channel = supabase.channel('resellers_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'resellers' }, () => fetchResellers()).subscribe();
    return () => { supabase.removeChannel(channel); };
};
