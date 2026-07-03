'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { ProductForm } from '@/components/products/product-form';
import { useProduct, useUpdateProduct } from '@/hooks/use-api';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);

  return (
    <>
      <Header title="Edit product" description={product?.sku ?? ''} />
      <PageShell>
        {isLoading || !product ? (
          <TableSkeleton rows={6} cols={2} />
        ) : (
          <ProductForm
            initial={product}
            loading={update.isPending}
            onSubmit={async (data) => {
              await update.mutateAsync(data);
              router.push('/products');
            }}
          />
        )}
      </PageShell>
    </>
  );
}
