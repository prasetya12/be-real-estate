import { type Response, type Request, type NextFunction } from "express";
import { app_error } from '../error_handler/error_handler';
import { supabase } from "../lib/supabaseClient";
interface body_params {
    fullname: string;
    email: string;
    password: string;
    confirm_password: string
}
export const registerController = async (req: Request<{}, {}, body_params>, res: Response, next: NextFunction): Promise<void> => {
    const { fullname, email, password, confirm_password } = req.body;
    if (!fullname || !email || !password || !confirm_password) {
        res.status(400).json({ error: 'Please provide fullname, email, password, and confirm_password.' });
    }

    if (password !== confirm_password) {
        res.status(400).json({ error: 'Passwords do not match.' });
    }
    try {
        const { data: existingUser, error: emailCheckError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .maybeSingle();


        if (emailCheckError) {
            res.status(500).json({ error: 'Error checking existing users' });
        }

        if (existingUser) {
            res.status(400).json({ error: 'Email is already registered.' });
        }


        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,

        });

        if (authError) {
            res.status(500).json({ error: 'Error creating user in Supabase Auth.' });
        }

        if (!userData) {
            res.status(401).json({ error: 'Unauthorized' });
        }
        const { data, error: profileError } = await supabase
            .from('profiles')
            .upsert(
                [
                    {
                        id: userData.user?.id,
                        full_name: fullname,
                        email: email,
                        role: 'user',
                    },
                ],
                { onConflict: 'id' }
            );


        if (profileError) {
            res.status(500).json({ error: 'Error creating user profile.' });
        }

        res.status(201).json({ message: 'User registered successfully!', user: data });

    } catch (error) {
        next(error);
    }
};


interface loginBodyParams {
    email: string;
    password: string;
}
export const loginController = async (req: Request<{}, {}, body_params>, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });


        const response ={
            user:loginData.user,
            access_token:loginData.session?.access_token
        }


        if (loginError) {
            res.status(400).json({ error: 'Error logging in' });
        }

       res.status(200).json({ message: 'User created and logged in', data: response });
    } catch (error) {
        next(error);

    }
}
