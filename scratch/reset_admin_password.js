import { supabase } from '../src/config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
    const email = 'storelan.bolivia@gmail.com';
    const newPassword = 'admin123'; // Contraseña de administrador temporal
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    const { data, error } = await supabase
        .from('usuarios')
        .update({ password: passwordHash })
        .eq('email', email)
        .select('*');
        
    if (error) {
        console.error("Error al actualizar la contraseña del administrador:", error);
    } else {
        console.log("¡Contraseña de administrador restablecida con éxito a 'admin123'!");
        console.log(data);
    }
}

run();
