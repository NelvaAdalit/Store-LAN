import bcrypt from 'bcryptjs';

// 1. Aquí pones la contraseña que tú vas a teclear para entrar a tu sistema
const passwordPlana = "gerenciala123"; 

const generarHash = async () => {
    // 2. Le damos 10 "vueltas" de cifrado (es el estándar de seguridad)
    const salt = await bcrypt.genSalt(10);
    // 3. Transformamos la contraseña plana en el código indescifrable
    const hash = await bcrypt.hash(passwordPlana, salt);

    console.log("========================================");
    console.log("TU CONTRASEÑA CIFRADA (HASH) ES:");
    console.log(hash);
    console.log("========================================");
    console.log("Copia todo el texto de arriba y pégalo en la columna 'password' de Supabase.");
};

generarHash();