import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';



export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) res.status(401).json({ error: 'Unauthorized: No token' });

    const { data, error } = await supabase.auth.getUser(token);


    if (error || !data) {
        res.status(403).json({ error: 'Unauthorized' });
    }
    req.user = data.user;

    next();
};