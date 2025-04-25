
import { type Response, type Request, type NextFunction } from "express";
import { supabase } from "../lib/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

export const createProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { title, description, price, address, latitude, longitude } = req.body
    let imageUrl: string | null = null;
    const user_id: string = req?.user?.id;
    console.log(user_id, 'ab')

    if (req.file) {
        try {
            // Upload image to Supabase storage
            const filePath = `properties/${uuidv4()}.jpg`; // Set a unique file name

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('property-images') // Supabase bucket name
                .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

            console.log(uploadError, 'ahlo')
            if (uploadError) {
                res.status(500).json({ error: 'Failed to upload image' });
            }

            // Get the public URL of the uploaded image
            imageUrl = supabase.storage.from('property-images').getPublicUrl(filePath).data.publicUrl;
        } catch (error) {
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }

    try {
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .insert({
                title, description, price, address, latitude, longitude, user_id
            }).select().single()




        console.log(propertyData, 'prop')
        // Insert image into property_images table if image exists
        if (imageUrl) {
            const { error: imageError } = await supabase
                .from('property_images')
                .insert([{
                    property_id: propertyData?.id,
                    url: imageUrl,
                    is_primary: true,
                }]);

            if (imageError) {
                res.status(500).json({ error: 'Failed to associate image with property' });
            }
        }

        res.status(201).json({ message: 'Property created successfully', propertyId: propertyData?.id });

        console.log(propertyData, 'a')
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });

    }
}

export const getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user_id: string = req?.user?.id;


        // Only return properties that belong to the authenticated user
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', user_id);

        if (error) {
            res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });
    }
}