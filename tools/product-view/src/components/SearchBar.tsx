import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps extends TextInputProps {
  onPress?: () => void;
  onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onPress,
  onSearch,
  editable = true,
  ...props
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    icon: {
      color: colors.textSecondary,
    },
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleSubmit = (text: string) => {
    if (onSearch) {
      onSearch(text);
    }
  };

  if (!editable && onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <Icon name="search" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Icon name="search" size={20} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onSubmitEditing={(e) => handleSubmit(e.nativeEvent.text)}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
};

export default SearchBar; 