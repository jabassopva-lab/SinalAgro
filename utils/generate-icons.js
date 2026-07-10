import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';

async function generate() {
  try {
    const inputPath = path.resolve('src/assets/images/pwa_logo_512_1781625612996.jpg');
    const out192 = path.resolve('public/pwa-192.png');
    const out512 = path.resolve('public/pwa-512.png');

    console.log(`Lendo imagem fonte de: ${inputPath}`);
    if (!fs.existsSync(inputPath)) {
      console.error(`Erro: Imagem de origem não encontrada em ${inputPath}`);
      process.exit(1);
    }

    const image = await Jimp.read(inputPath);

    console.log('Redimensionando para 192x192...');
    const img192 = image.clone();
    if (typeof img192.resize === 'function') {
      try {
        await img192.resize({ w: 192, h: 192 });
      } catch (e) {
        await img192.resize(192, 192);
      }
    }
    await img192.write(out192);
    console.log(`Ícone 192x192 salvo com sucesso em: ${out192}`);

    console.log('Redimensionando para 512x512...');
    const img512 = image.clone();
    if (typeof img512.resize === 'function') {
      try {
        await img512.resize({ w: 512, h: 512 });
      } catch (e) {
        await img512.resize(512, 512);
      }
    }
    await img512.write(out512);
    console.log(`Ícone 512x512 salvo com sucesso em: ${out512}`);

    console.log('Todas as imagens do PWA foram geradas com absoluto sucesso!');
  } catch (error) {
    console.error('Erro ao gerar as imagens do PWA:', error);
    process.exit(1);
  }
}

generate();
