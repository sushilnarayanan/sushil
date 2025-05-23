
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useProductData, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  useCategoryData 
} from '@/hooks/usePortfolio';
import { ProductItem, ProductCreateInput, CategoryItem } from '@/integrations/supabase/types/portfolio';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';

const Portfolio = () => {
  const { data: productItems, isLoading, error } = useProductData();
  const { data: categories } = useCategoryData();
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const queryClient = useQueryClient();
  
  const form = useForm<ProductCreateInput>({
    defaultValues: {
      title: '',
      description: '',
      thumbnail_url: '',
      product_video: '',
      product_link: '',
      github_link: '',
      category_id: null,
      tags: []
    }
  });

  React.useEffect(() => {
    if (editingItem) {
      form.reset({
        title: editingItem.title,
        description: editingItem.description || '',
        thumbnail_url: editingItem.thumbnail_url || '',
        product_video: editingItem.product_video || '',
        product_link: editingItem.product_link || '',
        github_link: editingItem.github_link || '',
        category_id: editingItem.category_id,
        tags: editingItem.tags || []
      });
      
      // Set selected categories from the editing item
      if (editingItem.categories) {
        setSelectedCategories(editingItem.categories.map(c => c.id));
      } else if (editingItem.category_id) {
        // Fallback to legacy category_id
        setSelectedCategories([editingItem.category_id]);
      } else {
        setSelectedCategories([]);
      }
    }
  }, [editingItem, form]);

  const onSubmit = async (data: ProductCreateInput) => {
    try {
      // Handle tags as array
      const formattedData = {
        ...data,
        tags: data.tags || [],
        // Add categoryIds for multi-category support
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined
      };
      
      if (editingItem) {
        await updateProduct(editingItem.id, formattedData);
      } else {
        await addProduct(formattedData);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'category'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'categoryId'] });
      setEditingItem(null);
      setSelectedCategories([]);
      form.reset({
        title: '',
        description: '',
        thumbnail_url: '',
        product_video: '',
        product_link: '',
        github_link: '',
        category_id: null,
        tags: []
      });
    } catch (error) {
      console.error('Error saving product item:', error);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteProduct(id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products', 'category'] });
        queryClient.invalidateQueries({ queryKey: ['products', 'categoryId'] });
      } catch (error) {
        console.error('Error deleting product item:', error);
      }
    }
  };
  
  const handleEdit = (item: ProductItem) => {
    setEditingItem(item);
  };
  
  const cancelEdit = () => {
    setEditingItem(null);
    setSelectedCategories([]);
    form.reset({
      title: '',
      description: '',
      thumbnail_url: '',
      product_video: '',
      product_link: '',
      github_link: '',
      category_id: null,
      tags: []
    });
  };

  // Handle tags as comma-separated string in the UI
  const [tagsInput, setTagsInput] = useState('');
  
  useEffect(() => {
    // When editing, convert tags array to string
    if (editingItem?.tags) {
      setTagsInput(editingItem.tags.join(', '));
    } else {
      setTagsInput('');
    }
  }, [editingItem]);

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    // Convert comma-separated string to array and trim whitespace
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    form.setValue('tags', tagsArray);
  };
  
  // Toggle a category selection
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(current => 
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-netflix-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl pt-8 pb-16 px-4">
        <h1 className="text-2xl font-bold mb-6">Product Management</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Product Item' : 'Add New Product Item'}</CardTitle>
            <CardDescription>
              {editingItem 
                ? 'Update your product item details below' 
                : 'Fill in the details to add a new item to your products'
              }
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Project Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Project Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Categories (select multiple)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {categories?.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`} 
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="tag1, tag2, tag3" 
                      value={tagsInput}
                      onChange={handleTagsChange}
                    />
                  </FormControl>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="product_video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="product_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourproduct.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="github_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/yourusername/repo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex justify-between">
                {editingItem && (
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <h2 className="text-xl font-bold mb-4">Your Product Items</h2>
        
        {isLoading && <p>Loading product items...</p>}
        
        {error && <p className="text-red-500">Error loading product items</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productItems && productItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.thumbnail_url && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
                
                {/* Display all categories for this item */}
                {item.categories && item.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.categories.map(category => (
                      <span 
                        key={category.id} 
                        className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Fallback to single category if categories array is not available */}
                {(!item.categories || item.categories.length === 0) && item.category_id && categories && (
                  <div className="text-sm">
                    Category: {categories.find(c => c.id === item.category_id)?.name || 'Unknown'}
                  </div>
                )}
                
                {/* Show tags if available */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="text-xs text-gray-500">#{tag}</span>
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {productItems && productItems.length === 0 && (
            <p className="col-span-2 text-center py-8">
              No product items found. Add your first item using the form above.
            </p>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Portfolio;
