import { supabase, Book, BookInsert, BookUpdate, BookImage, BookImageInsert } from './supabase'

// Book operations
export const createBook = async (bookData: BookInsert): Promise<{ data: Book | null; error: any }> => {
  const { data, error } = await supabase
    .from('books')
    .insert(bookData)
    .select()
    .single()
  
  return { data, error }
}

export const updateBook = async (id: string, updates: BookUpdate): Promise<{ data: Book | null; error: any }> => {
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const getBook = async (id: string): Promise<{ data: Book | null; error: any }> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const getAllBooks = async (): Promise<{ data: Book[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const deleteBook = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Book image operations
export const addBookImage = async (imageData: BookImageInsert): Promise<{ data: BookImage | null; error: any }> => {
  const { data, error } = await supabase
    .from('book_images')
    .insert(imageData)
    .select()
    .single()
  
  return { data, error }
}

export const getBookImages = async (bookId: string): Promise<{ data: BookImage[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('book_images')
    .select('*')
    .eq('book_id', bookId)
    .order('image_order', { ascending: true })
  
  return { data, error }
}

export const deleteBookImage = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('book_images')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Upload base64 image to Supabase Storage
export const uploadBase64ImageToStorage = async (
  base64Data: string,
  fileName: string,
  bookId: string
): Promise<{ url: string | null; error: any }> => {
  try {
    console.log(`[Storage] Uploading ${fileName} for book ${bookId}`)
    
    // Convert base64 to blob
    const base64Response = await fetch(`data:image/png;base64,${base64Data}`);
    const blob = await base64Response.blob();
    
    // Create file path
    const filePath = `${bookId}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('book-images')
      .upload(filePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true // Allow overwriting if file exists
      })

    if (error) {
      console.error(`[Storage] Failed to upload ${fileName}:`, error)
      return { url: null, error }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('book-images')
      .getPublicUrl(data.path)

    console.log(`[Storage] Successfully uploaded ${fileName}`)
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error(`[Storage] Exception uploading ${fileName}:`, error)
    return { url: null, error }
  }
}



// Upload image file to Supabase Storage
export const uploadImageToStorage = async (
  file: File,
  fileName: string,
  bookId?: string
): Promise<{ url: string | null; error: any }> => {
  try {
    const filePath = bookId ? `${bookId}/${fileName}` : fileName
    
    const { data, error } = await supabase.storage
      .from('book-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { url: null, error }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('book-images')
      .getPublicUrl(data.path)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    return { url: null, error }
  }
}

// Combined operation to save a complete book with story and images
export const saveCompleteBook = async (
  title: string,
  storyContent: string,
  generatedImages: Array<{
    id: number
    title: string
    imageBase64: string
    imageUrl?: string
    savedFilePath?: string
    prompt: string
  }>,
  bookProgress: number = 100,
  status: 'draft' | 'in_progress' | 'completed' | 'published' = 'completed'
): Promise<{ bookId: string | null; error: any }> => {
  try {
    // First, create the book (without storing base64 images in JSONB)
    const bookData: BookInsert = {
      title,
      story_content: storyContent,
      book_progress: bookProgress,
      status,
      images: [], // We'll populate this with storage URLs after upload
      metadata: {
        total_images: generatedImages.length,
        created_from_prompt: true,
        ai_generated: true
      }
    }

    const { data: book, error: bookError } = await createBook(bookData)
    
    if (bookError || !book) {
      return { bookId: null, error: bookError }
    }

    console.log(`Created book with ID: ${book.id}, now uploading ${generatedImages.length} images to storage...`)

    // Upload images to Supabase storage and save references
    const uploadPromises = generatedImages.map(async (img, index) => {
      try {
        const fileName = `image-${img.id}-${img.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`
        
        // Upload base64 image to storage
        const { url: storageUrl, error: uploadError } = await uploadBase64ImageToStorage(
          img.imageBase64,
          fileName,
          book.id
        )

                 if (uploadError) {
           console.error(`Failed to upload image ${img.id}:`, uploadError)
           // Fallback to data URL if storage upload fails
           const fallbackUrl = `data:image/png;base64,${img.imageBase64}`
           return {
             storageUrl: fallbackUrl,
             imageData: {
               book_id: book.id,
               image_url: fallbackUrl,
               image_name: fileName,
               image_description: img.prompt,
               image_order: img.id,
               image_type: 'image/png',
               image_size: Math.round(img.imageBase64.length * 0.75) // Approximate size
             }
           }
         }

         // Ensure storageUrl is not null
         const finalUrl = storageUrl || `data:image/png;base64,${img.imageBase64}`

         return {
           storageUrl: finalUrl,
           imageData: {
             book_id: book.id,
             image_url: finalUrl,
             image_name: fileName,
             image_description: img.prompt,
             image_order: img.id,
             image_type: 'image/png',
             image_size: Math.round(img.imageBase64.length * 0.75) // Approximate size
           }
         }
             } catch (error) {
         console.error(`Error processing image ${img.id}:`, error)
         // Fallback to data URL
         const fallbackUrl = `data:image/png;base64,${img.imageBase64}`
         return {
           storageUrl: fallbackUrl,
           imageData: {
             book_id: book.id,
             image_url: fallbackUrl,
             image_name: `image-${img.id}.png`,
             image_description: img.prompt,
             image_order: img.id,
             image_type: 'image/png'
           }
         }
       }
    })

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises)
    
    // Insert image records into book_images table
    const imageInsertPromises = uploadResults.map(result => addBookImage(result.imageData))
    const imageResults = await Promise.all(imageInsertPromises)
    
    // Check if any image insertions failed
    const failedImages = imageResults.filter(result => result.error)
    if (failedImages.length > 0) {
      console.warn('Some images failed to save to database:', failedImages.map(f => f.error))
    }

    // Update book with storage URLs in the images JSONB field
    const imageUrls = uploadResults.map((result, index) => ({
      id: generatedImages[index].id,
      title: generatedImages[index].title,
      url: result.storageUrl,
      prompt: generatedImages[index].prompt,
      order: generatedImages[index].id
    }))

    const { error: updateError } = await updateBook(book.id, {
      images: imageUrls
    })

    if (updateError) {
      console.error('Failed to update book with image URLs:', updateError)
    }

    console.log(`Successfully saved book ${book.id} with ${uploadResults.length} images to Supabase storage`)
    return { bookId: book.id, error: null }
  } catch (error) {
    console.error('Error saving complete book:', error)
    return { bookId: null, error }
  }
} 