import { View, Text, Pressable, ActivityIndicator, type PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-primary',
  secondary: 'bg-stone-200',
  danger: 'bg-danger',
  ghost: 'bg-transparent border border-stone-300',
};

const textStyles = {
  primary: 'text-white',
  secondary: 'text-stone-800',
  danger: 'text-white',
  ghost: 'text-stone-800',
};

const sizeStyles = {
  sm: 'py-2 px-4 min-h-[40px]',
  md: 'py-3 px-6 min-h-[48px]',
  lg: 'py-4 px-8 min-h-[56px]',
};

export function Button({
  title,
  variant = 'primary',
  loading,
  size = 'md',
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  return (
    <Pressable
      className={`rounded-xl items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#1C1917' : '#fff'} />
      ) : (
        <Text className={`font-semibold text-base ${textStyles[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
