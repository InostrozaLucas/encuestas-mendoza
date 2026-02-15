import { supabase } from './supabase'

/**
 * Uploads a file to the 'survey-images' bucket
 * @param file The file to upload
 * @param path Optional path prefix (e.g. 'candidates/')
 * @returns The public URL of the uploaded file
 */
export async function uploadImage(file: File, path: string = 'candidates'): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${path}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('survey-images')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Error uploading file:', uploadError)
            throw uploadError
        }

        const { data } = supabase.storage
            .from('survey-images')
            .getPublicUrl(fileName)

        return data.publicUrl
    } catch (error) {
        console.error('Upload failed:', error)
        return null
    }
}

/**
 * Returns the full URL for a storage path or returns the URL as-is if it's already a full URL.
 * Handles cases where DB might only save the filename/path instead of a complete URL.
 */
export function getStorageUrl(pathOrUrl: string | undefined | null): string | undefined {
    if (!pathOrUrl) return undefined

    // Already a full URL — return as-is
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
        return pathOrUrl
    }

    // Relative path — build the full public URL via Supabase client
    const { data } = supabase.storage
        .from('survey-images')
        .getPublicUrl(pathOrUrl)

    return data.publicUrl
}

