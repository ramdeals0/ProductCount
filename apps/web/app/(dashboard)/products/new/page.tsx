'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';
import { ProductForm } from '@/components/products/product-form';
import { useCreateProduct } from '@/hooks/use-api';

export default function NewProductPage() {
  const router = useRouter();
  const create = useCreateProduct();

  return (
    <>
      <Header title="Add product" description="Create a new product in the master catalog" />
      <PageShell>
        <ProductForm
          loading={create.isPending}
          onSubmit={async (data) => {
            await create.mutateAsync(data);
            router.push('/products');
          }}
        />
      </PageShell>
    </>
  );
}
