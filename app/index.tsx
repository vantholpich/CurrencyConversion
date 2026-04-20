import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Dimensions, Modal, FlatList, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, FadeIn, FadeOut } from 'react-native-reanimated';
import { CURRENCIES, getCurrencyByCode, Currency, getFlagUrl } from '../constants/currencies';

export default function Index() {
  const insets = useSafeAreaInsets();
  
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [leftCurrencyCode, setLeftCurrencyCode] = useState('AUD');
  const [rightCurrencyCode, setRightCurrencyCode] = useState('USD');
  const [showPicker, setShowPicker] = useState(false);
  const [pickingSide, setPickingSide] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const leftCurrency = getCurrencyByCode(leftCurrencyCode);
  const rightCurrency = getCurrencyByCode(rightCurrencyCode);

  // Animation for the swap bulge
  const swapScale = useSharedValue(1);

  const leftBgColor = leftCurrency.color;
  const rightBgColor = rightCurrency.color;
  
  const isLight = (hex: string) => {
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma > 165; // Slightly higher threshold for better readability
  };

  const leftTextColor = isLight(leftBgColor) ? '#000000' : '#FFFFFF';
  const rightTextColor = isLight(rightBgColor) ? '#000000' : '#FFFFFF';
  const leftSubTextColor = isLight(leftBgColor) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const rightSubTextColor = isLight(rightBgColor) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const leftOverlayColor = isLight(leftBgColor) ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)';
  const leftBorderColor = isLight(leftBgColor) ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';

  const fetchRate = async () => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${leftCurrencyCode}`);
      const data = await response.json();
      setExchangeRate(data.rates[rightCurrencyCode]);
    } catch (error) {
      console.error('Error fetching rate', error);
      setExchangeRate(1.0);
    }
  };

  useEffect(() => {
    fetchRate();
  }, [leftCurrencyCode, rightCurrencyCode]);

  useEffect(() => {
    if (exchangeRate !== null) {
      const numAmount = parseFloat(amount || '0');
      setConvertedAmount((numAmount * exchangeRate).toFixed(2));
    }
  }, [amount, exchangeRate]);

  const formatNumber = (numStr: string) => {
    if (!numStr) return '0';
    const parts = numStr.split('.');
    const intPart = parseInt(parts[0], 10);
    const formattedInt = isNaN(intPart) ? '0' : intPart.toLocaleString('en-US');
    if (parts.length > 1) return `${formattedInt}.${parts[1]}`;
    return formattedInt;
  };

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setAmount('0');
    } else if (key === '⌫') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.');
      }
    } else {
      setAmount((prev) => (prev === '0' ? key : prev + key));
    }
  };

  const swapCurrencies = () => {
    swapScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1)
    );
    const temp = leftCurrencyCode;
    setLeftCurrencyCode(rightCurrencyCode);
    setRightCurrencyCode(temp);
    setAmount('0');
  };

  const openPicker = (side: 'left' | 'right') => {
    setPickingSide(side);
    setSearchQuery('');
    setShowPicker(true);
  };

  const selectCurrency = (currency: Currency) => {
    if (pickingSide === 'left') {
      setLeftCurrencyCode(currency.code);
    } else {
      setRightCurrencyCode(currency.code);
    }
    setShowPicker(false);
  };

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return CURRENCIES;
    return CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getDynamicFontSize = (text: string) => {
    const len = text.length;
    if (len <= 7) return 42;
    if (len <= 10) return 34;
    if (len <= 13) return 26;
    if (len <= 16) return 20;
    return 16;
  };

  const formattedAmount = formatNumber(amount);
  const formattedConverted = formatNumber(convertedAmount);

  const animatedBulgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swapScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: leftBgColor }]}>
      <StatusBar barStyle={isLight(leftBgColor) ? "dark-content" : "light-content"} backgroundColor="transparent" translucent />
      
      <View style={styles.splitContainer}>
        {/* LEFT PANEL */}
        <Pressable 
          onPress={() => openPicker('left')}
          style={[styles.panel, { backgroundColor: leftBgColor, paddingTop: insets.top }]}
        >
          <View style={styles.headerRowLeft}>
            <Text style={[styles.headerLogo, { color: leftTextColor }]}>CONVERTx</Text>
          </View>
          <View style={styles.currencyDisplay}>
            <View style={styles.currencyLabelRow}>
               <Image 
                 source={{ uri: getFlagUrl(leftCurrency.countryCode) }} 
                 style={styles.flagImage} 
               />
               <Text style={[styles.currencyLabel, { color: leftSubTextColor }]}>{leftCurrency.code}</Text>
               <Ionicons name="chevron-down" size={14} color={leftSubTextColor} style={{ marginLeft: 4 }} />
            </View>
            <Text 
              style={[
                styles.amountText, 
                { color: leftTextColor, fontSize: getDynamicFontSize(formattedAmount) }
              ]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {formattedAmount}
            </Text>
          </View>
        </Pressable>

        {/* RIGHT PANEL */}
        <Pressable 
          onPress={() => openPicker('right')}
          style={[styles.panel, { backgroundColor: rightBgColor, paddingTop: insets.top }]}
        >
          <View style={styles.headerRowRight}>
            <Ionicons name="swap-horizontal" size={18} color={rightSubTextColor} />
          </View>
          <View style={styles.currencyDisplay}>
            <View style={styles.currencyLabelRow}>
               <Image 
                 source={{ uri: getFlagUrl(rightCurrency.countryCode) }} 
                 style={styles.flagImage} 
               />
               <Text style={[styles.currencyLabel, { color: rightSubTextColor }]}>{rightCurrency.code}</Text>
               <Ionicons name="chevron-down" size={14} color={rightSubTextColor} style={{ marginLeft: 4 }} />
            </View>
            <Text 
              style={[
                styles.amountTextRight, 
                { color: rightTextColor, fontSize: getDynamicFontSize(formattedConverted) }
              ]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {formattedConverted}
            </Text>
          </View>
        </Pressable>

        {/* CENTER SWAP BULGE */}
        <View style={styles.swapWrapper}>
          <Animated.View style={[styles.swapBulge, animatedBulgeStyle, { backgroundColor: rightBgColor }]}>
            <Pressable onPress={swapCurrencies} style={styles.swapButton}>
              <Text style={[styles.toText, { color: rightSubTextColor }]}>To</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* BOTTOM NUMPAD */}
      <View style={[styles.numpadContainer, { backgroundColor: leftBgColor, paddingBottom: insets.bottom + 10 }]}>
        <View style={[styles.operatorRow, { backgroundColor: leftOverlayColor }]}>
          {['+', '×', '÷', '-'].map((op, i) => ( 
            <Pressable key={i} style={[styles.opButton, { borderColor: leftBorderColor }]}>
              <Text style={[styles.opText, { color: leftTextColor }]}>{op}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.keypadGrid}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['C', '0', '⌫']
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  style={({ pressed }) => [
                    styles.keyButton,
                    { opacity: pressed ? 0.4 : 1 }
                  ]}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={24} color={leftTextColor} />
                  ) : (
                    <Text style={[styles.keyText, { color: leftTextColor }]}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* CURRENCY PICKER MODAL */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBlur} onPress={() => setShowPicker(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <Pressable onPress={() => setShowPicker(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search currency..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.currencyItem}
                  onPress={() => selectCurrency(item)}
                >
                  <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
                    <Image 
                      source={{ uri: getFlagUrl(item.countryCode) }} 
                      style={styles.itemFlagImage} 
                    />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  {(pickingSide === 'left' ? leftCurrencyCode : rightCurrencyCode) === item.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </Pressable>
              )}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  headerRowLeft: {
    paddingTop: 14,
    alignItems: 'flex-start',
  },
  headerRowRight: {
    paddingTop: 14,
    alignItems: 'flex-end',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  currencyDisplay: {
    alignItems: 'flex-start',
    width: '100%',
  },
  currencyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  flagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1,
  },
  amountTextRight: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: -1,
  },
  swapWrapper: {
    position: 'absolute',
    left: '50%',
    bottom: 52, 
    zIndex: 10,
    transform: [{ translateX: -23 }, { translateY: 23 }],
  },
  swapBulge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  swapButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  numpadContainer: {
    paddingTop: 0,
  },
  operatorRow: {
    flexDirection: 'row',
    height: 54,
  },
  opButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  opText: {
    fontSize: 20,
    fontWeight: '400',
  },
  keypadGrid: {
    paddingHorizontal: 15,
    paddingTop: 25,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  keyButton: {
    flex: 1,
    height: 60, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 30,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemFlagImage: {
    width: 28,
    height: 20,
    borderRadius: 2,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemCode: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemName: {
    fontSize: 14,
    color: '#717171',
    marginTop: 1,
  },
});
