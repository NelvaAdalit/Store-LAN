import bcrypt from 'bcryptjs';

const email = 'storelan.bolivia@gmail.com';
const password = '123456';

const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);

console.log('\n==================================================');
console.log('✅ CONTRASEÑA ENCRIPTADA CON ÉXITO');
console.log('==================================================\n');
console.log('Ejecuta la siguiente consulta SQL en la pestaña "SQL Editor" de Supabase:\n');

const sqlQuery = `INSERT INTO public.usuarios (email, password, rol)\nVALUES ('${email}', '${passwordHash}', 'admin');`;

console.log(sqlQuery);
console.log('\n==================================================\n');
