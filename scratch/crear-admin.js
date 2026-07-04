import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('==================================================');
console.log('   CREADOR SEGURO DE ADMINISTRADORES - STORE LAN  ');
console.log('==================================================\n');

rl.question('1. Ingresa el correo electrónico para el nuevo Admin: ', (email) => {
    rl.question('2. Ingresa la contraseña para el nuevo Admin: ', async (password) => {
        if (!email || !password) {
            console.error('\n❌ Error: El correo y la contraseña son requeridos.');
            rl.close();
            return;
        }

        try {
            // Generamos el hash con bcrypt (mismo algoritmo usado por el backend)
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            console.log('\n==================================================');
            console.log('✅ CONTRASEÑA ENCRIPTADA CON ÉXITO');
            console.log('==================================================\n');
            console.log('Copia y ejecuta la siguiente consulta SQL en el panel de control de Supabase');
            console.log('(Pestaña "SQL Editor" -> "+ New Query" -> Pegar y presionar Run):\n');
            
            const sqlQuery = `INSERT INTO public.usuarios (email, password, rol)\nVALUES ('${email.trim()}', '${passwordHash}', 'admin');`;
            
            console.log('\x1b[36m%s\x1b[0m', sqlQuery);
            console.log('\n==================================================\n');
        } catch (err) {
            console.error('\n❌ Error al encriptar la contraseña:', err);
        } finally {
            rl.close();
        }
    });
});
