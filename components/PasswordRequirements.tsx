import { Check, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '../utils/passwordValidation';

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  const strength = getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return '#FF5252';
      case 'medium': return '#FF9800';
      case 'strong': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Password Requirements</Text>
        {password.length > 0 && (
          <View style={styles.strengthIndicator}>
            <View style={[styles.strengthBar, { backgroundColor: getStrengthColor() }]} />
            <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
              {getStrengthText()}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.requirementsList}>
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const isValid = requirement.test(password);
          return (
            <View key={requirement.id} style={styles.requirementItem}>
              <View style={[styles.iconContainer, isValid && styles.iconValid]}>
                {isValid ? (
                  <Check size={14} color="#4CAF50" />
                ) : (
                  <X size={14} color="#9E9E9E" />
                )}
              </View>
              <Text style={[
                styles.requirementText,
                isValid && styles.requirementTextValid
              ]}>
                {requirement.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  strengthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconValid: {
    backgroundColor: '#E8F5E8',
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  requirementTextValid: {
    color: '#4CAF50',
    fontWeight: '500',
  },
});
