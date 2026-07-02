import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { CountType } from '@shopcount/types';
import { useAuthStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { Category, Location, CountSession } from '@shopcount/types';
import { Button } from '../../src/components/Button';
import { InputField, CategoryChip, Card } from '../../src/components/ui';

const schema = z.object({
  sessionName: z.string().min(1),
  countType: z.enum([CountType.FULL, CountType.CYCLE, CountType.SPOT]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateCountScreen() {
  const { accessToken, user } = useAuthStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      sessionName: '',
      countType: CountType.FULL,
      notes: '',
    },
  });

  const countType = watch('countType');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', user?.storeId],
    queryFn: () =>
      apiRequest<Category[]>(`/categories?storeId=${user!.storeId}`, { token: accessToken }),
    enabled: !!accessToken && !!user?.storeId,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', user?.storeId],
    queryFn: () =>
      apiRequest<Location[]>(`/locations?storeId=${user!.storeId}`, { token: accessToken }),
    enabled: !!accessToken && !!user?.storeId,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest<CountSession>('/count-sessions', {
        method: 'POST',
        token: accessToken,
        deviceId: useAuthStore.getState().deviceId,
        body: {
          storeId: user!.storeId,
          sessionName: data.sessionName,
          countType: data.countType,
          categoryIds: selectedCategories.length ? selectedCategories : categories.map((c) => c.id),
          locationIds: selectedLocations.length ? selectedLocations : locations.map((l) => l.id),
          notes: data.notes,
        },
      }),
    onSuccess: (session) => {
      router.replace(`/count/${session.id}`);
    },
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create session');
    },
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-8">
      <Controller
        control={control}
        name="sessionName"
        render={({ field: { onChange, value } }) => (
          <InputField
            label="Session Name"
            value={value}
            onChangeText={onChange}
            placeholder="e.g. Weekly Full Count"
          />
        )}
      />

      <Text className="text-sm font-medium text-stone-700 mb-2">Count Type</Text>
      <View className="flex-row flex-wrap mb-4">
        {[CountType.FULL, CountType.CYCLE, CountType.SPOT].map((type) => (
          <CategoryChip
            key={type}
            label={type.charAt(0).toUpperCase() + type.slice(1)}
            selected={countType === type}
            onPress={() => setValue('countType', type)}
          />
        ))}
      </View>

      <Text className="text-sm font-medium text-stone-700 mb-2">Categories (optional)</Text>
      <View className="flex-row flex-wrap mb-4">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            selected={selectedCategories.includes(cat.id)}
            onPress={() => toggleCategory(cat.id)}
          />
        ))}
      </View>

      <Text className="text-sm font-medium text-stone-700 mb-2">Locations (optional)</Text>
      <View className="flex-row flex-wrap mb-4">
        {locations.map((loc) => (
          <CategoryChip
            key={loc.id}
            label={loc.name}
            selected={selectedLocations.includes(loc.id)}
            onPress={() => toggleLocation(loc.id)}
          />
        ))}
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <InputField
            label="Notes (optional)"
            value={value ?? ''}
            onChangeText={onChange}
            placeholder="Any notes for this count..."
          />
        )}
      />

      <Card className="mb-4 bg-blue-50 border-blue-200">
        <Text className="text-sm text-stone-700">
          Leave categories/locations unselected to include all. Counts work offline and sync later.
        </Text>
      </Card>

      <Button
        title="Create Count Session"
        onPress={handleSubmit((data) => createMutation.mutate(data))}
        loading={createMutation.isPending}
        size="lg"
      />
    </ScrollView>
  );
}
