import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carga las variables desde tu archivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Creamos el cliente que usaremos en todos los controladores
export const supabase = createClient(supabaseUrl, supabaseKey);