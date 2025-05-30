
import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import ProjectCard from './ProjectCard';
import { Project } from '@/data/projects';
import { ProductItem } from '@/integrations/supabase/types/portfolio';
import { assignProductsToCategory } from '@/utils/categoryAssigner';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ContentRowProps {
  title: string;
  projects?: Project[];
  productItems?: ProductItem[];
  categorySlug?: string;
}

const ContentRow = ({
  title,
  projects,
  productItems,
  categorySlug
}: ContentRowProps) => {
  const queryClient = useQueryClient();

  // Function to handle assigning specific products to categories from the UI
  const assignToCategory = async () => {
    if (!categorySlug) return;
    let productIds: number[] = [];
    if (categorySlug === 'microsaas') {
      productIds = [1, 9, 13, 14, 16];
    } else if (categorySlug === 'nocode') {
      productIds = [2, 3, 7, 11];
    }
    if (productIds.length === 0) return;
    try {
      toast({
        title: 'Assigning products',
        description: `Assigning products to ${title} category...`
      });
      const success = await assignProductsToCategory(productIds, categorySlug);
      if (success) {
        toast({
          title: 'Success',
          description: `Products assigned to ${title} category successfully!`
        });

        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({
          queryKey: ['products', 'category', categorySlug]
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to assign products to ${title} category`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error assigning products:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign products to category',
        variant: 'destructive'
      });
    }
  };

  // Convert portfolio items to project format if provided
  const displayItems = productItems ? productItems.map(item => ({
    id: String(item.id),
    title: item.title,
    subtitle: item.description || '',
    description: item.description || '',
    image: item.thumbnail_url || '/placeholder.svg',
    videoUrl: item.product_video || undefined,
    tags: item.tags || [],
    productLink: item.product_link || undefined,
    categories: item.categories || [],
    showTitleByDefault: true
  })) : projects || [];
  
  return (
    <div className="netflix-row mb-8"> 
      {/* Title - properly aligned with consistent left padding */}
      <h2 className="text-2xl font-bold mb-3 text-white px-4 sm:px-8 md:px-12 text-left lg:px-[34px]">{title}</h2>
      
      {/* Grid container with padding */}
      <div className="px-4 sm:px-8 md:px-12 lg:px-[34px]">
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayItems.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-[200px] text-gray-400 bg-gray-800/30 rounded p-4">
            No items in this category yet
            {categorySlug && (
              <button 
                onClick={assignToCategory} 
                className="ml-2 text-sm bg-netflix-red hover:bg-netflix-red/90 text-white px-3 py-1 rounded-md flex items-center"
              >
                <RefreshCcw size={16} className="mr-1" /> Assign
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentRow;
