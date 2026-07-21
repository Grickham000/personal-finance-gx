import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';

export const useProfile = () => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categories, setCategories] = useState<string[]>(['food', 'transport', 'housing', 'services', 'entertainment', 'other']);
  const [newCategory, setNewCategory] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [newPmName, setNewPmName] = useState('');
  const [newPmIsImmediate, setNewPmIsImmediate] = useState(true);
  const [newPmCutDate, setNewPmCutDate] = useState('0');
  const [newPmDaysToPay, setNewPmDaysToPay] = useState('0');
  const [pmModalVisible, setPmModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, expensesData] = await Promise.all([
        apiService.getUserProfile().catch((err: any) => {
          if (err.response?.status === 404 || (err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('not found'))) {
            return null;
          }
          throw err;
        }),
        apiService.getExpenses().catch((err: any) => {
          console.warn('Failed to load expenses for categories:', err);
          return [];
        })
      ]);

      const expenseCategories: string[] = Array.from(
        new Set((expensesData || []).map((exp: any) => exp.expense_type?.trim().toLowerCase()))
      ).filter(Boolean) as string[];

      if (profileData) {
        setProfileId(profileData.id);
        setUserName(profileData.user_name || '');
        setMonthlyIncome(String(profileData.monthly_income || '0'));
        setCurrency(profileData.currency || 'USD');
        
        const profileCategories = (profileData.expense_types || []).map((c: string) => c.trim().toLowerCase());
        const mergedCategories = Array.from(new Set([...profileCategories, ...expenseCategories]));
        setCategories(mergedCategories);
        setPaymentMethods(profileData.payment_methods || []);
      } else {
        if (expenseCategories.length > 0) {
          setCategories(expenseCategories);
        } else {
          setCategories(['food', 'transport', 'housing', 'services', 'entertainment', 'other']);
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      Alert.alert('Validation Error', 'Please enter your display name.');
      return;
    }
    if (!monthlyIncome || isNaN(Number(monthlyIncome))) {
      Alert.alert('Validation Error', 'Please enter a valid monthly income.');
      return;
    }
    if (categories.length === 0) {
      Alert.alert('Validation Error', 'Please configure at least one category tag.');
      return;
    }
    if (paymentMethods.length === 0) {
      Alert.alert('Validation Error', 'Please configure at least one payment method.');
      return;
    }

    setSaving(true);
    
    const payload = {
      user_name: userName.trim(),
      expense_types: categories,
      payment_methods: paymentMethods,
      monthly_income: parseFloat(monthlyIncome),
      currency: currency,
    };

    try {
      if (profileId) {
        await apiService.updateUserProfile(profileId, payload);
      } else {
        await apiService.createUserProfile(payload);
      }
      await fetchProfile();
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data || err.message || 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const cleanCat = newCategory.trim().toLowerCase();
    if (!cleanCat) return;
    if (categories.includes(cleanCat)) {
      Alert.alert('Exists', 'This category is already added.');
      return;
    }
    setCategories([...categories, cleanCat]);
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleAddPaymentMethod = () => {
    if (!newPmName.trim()) {
      Alert.alert('Required', 'Please specify a name.');
      return;
    }
    
    if (paymentMethods.some(pm => pm.name.toLowerCase() === newPmName.trim().toLowerCase())) {
      Alert.alert('Exists', 'A payment method with this name already exists.');
      return;
    }

    const nextPm = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPmName.trim(),
      is_immediate: newPmIsImmediate,
      cut_date: newPmIsImmediate ? 0 : parseInt(newPmCutDate) || 1,
      days_to_pay: newPmIsImmediate ? 0 : parseInt(newPmDaysToPay) || 0
    };

    setPaymentMethods([...paymentMethods, nextPm]);
    setNewPmName('');
    setNewPmIsImmediate(true);
    setNewPmCutDate('0');
    setNewPmDaysToPay('0');
    setPmModalVisible(false);
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  return {
    userName,
    setUserName,
    monthlyIncome,
    setMonthlyIncome,
    currency,
    setCurrency,
    categories,
    newCategory,
    setNewCategory,
    paymentMethods,
    newPmName,
    setNewPmName,
    newPmIsImmediate,
    setNewPmIsImmediate,
    newPmCutDate,
    setNewPmCutDate,
    newPmDaysToPay,
    setNewPmDaysToPay,
    pmModalVisible,
    setPmModalVisible,
    loading,
    saving,
    handleSaveProfile,
    handleAddCategory,
    handleRemoveCategory,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
  };
};
