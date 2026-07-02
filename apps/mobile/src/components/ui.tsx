import { View, Text, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ children, onPress, className }: CardProps) {
  const content = (
    <View className={`bg-white rounded-xl p-4 border border-stone-200 ${className ?? ''}`}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }
  return content;
}

interface StatusChipProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export function StatusChip({ label, color = '#78716C', bgColor = '#F5F5F4' }: StatusChipProps) {
  return (
    <View style={{ backgroundColor: bgColor }} className="px-3 py-1 rounded-full self-start">
      <Text style={{ color }} className="text-xs font-medium">
        {label}
      </Text>
    </View>
  );
}

interface RestrictedBadgeProps {
  type: string;
}

export function RestrictedBadge({ type }: RestrictedBadgeProps) {
  if (type === 'none') return null;
  const label = type === 'alcohol' ? 'Alcohol' : 'Tobacco';
  return <StatusChip label={label} color="#7C3AED" bgColor="#EDE9FE" />;
}

interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-lg font-semibold text-stone-800 mb-2">{title}</Text>
      {message && <Text className="text-base text-muted text-center">{message}</Text>}
    </View>
  );
}

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 mb-2 min-h-[40px] justify-center ${
        selected ? 'bg-primary' : 'bg-stone-200'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-stone-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 flex-1 border border-stone-200">
      <Text className="text-2xl font-bold" style={{ color: color ?? '#1C1917' }}>
        {value}
      </Text>
      <Text className="text-sm text-muted mt-1">{label}</Text>
    </View>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  className?: string;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  className,
}: InputFieldProps) {
  return (
    <View className={`mb-4 ${className ?? ''}`}>
      <Text className="text-sm font-medium text-stone-700 mb-2">{label}</Text>
      <View className="bg-white border border-stone-300 rounded-xl px-4 min-h-[48px] justify-center">
        <TextInputCompat
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

import { TextInput } from 'react-native';

function TextInputCompat(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className="text-base text-stone-900"
      placeholderTextColor="#A8A29E"
      {...props}
    />
  );
}
