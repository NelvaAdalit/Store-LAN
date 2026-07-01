import { supabase } from '../src/config/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
    console.log("URL:", process.env.SUPABASE_URL);
    
    // 1. Obtener usuarios (Admins)
    const { data: usuarios, error: errU } = await supabase.from('usuarios').select('*');
    if (errU) {
        console.error("Error al obtener usuarios:", errU);
    } else {
        console.log("\n--- TABLA USUARIOS (ADMINS) ---");
        console.log(usuarios);
    }

    // 2. Obtener clientes
    const { data: clientes, error: errC } = await supabase.from('clientes').select('*');
    if (errC) {
        console.error("Error al obtener clientes:", errC);
    } else {
        console.log("\n--- TABLA CLIENTES ---");
        console.log(clientes);
    }
}

run();
