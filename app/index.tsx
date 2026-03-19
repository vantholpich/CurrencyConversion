import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring, withSequence } from 'react-native-reanimated';

// Sample colors based on the image
const AUD_COLOR = '#FFCD00';
const USD_COLOR = '#0A3161';

export default function Index() {
  const insets = useSafeAreaInsets();
  
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isAudToUsd, setIsAudToUsd] = useState(true); // Left side is AUD, right is USD

  // Animation for the swap bulge
  const swapScale = useSharedValue(1);

  const leftBgColor = isAudToUsd ? AUD_COLOR : USD_COLOR;
  const rightBgColor = isAudToUsd ? USD_COLOR : AUD_COLOR;
  const leftTextColor = isAudToUsd ? '#000000' : '#FFFFFF';
  const rightTextColor = isAudToUsd ? '#FFFFFF' : '#000000';
  const leftSubTextColor = isAudToUsd ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)';
  const rightSubTextColor = isAudToUsd ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)';
  const leftOverlayColor = isAudToUsd ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';
  const leftBorderColor = isAudToUsd ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';

  const fetchRate = async () => {
    try {
      const from = isAudToUsd ? 'AUD' : 'USD';
      const to = isAudToUsd ? 'USD' : 'AUD';
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      const data = await response.json();
      setExchangeRate(data.rates[to]);
    } catch (error) {
      console.error('Error fetching rate', error);
      // Fallbacks roughly matching the image
      setExchangeRate(isAudToUsd ? 0.65 : 1.54);
    }
  };

  useEffect(() => {
    fetchRate();
  }, [isAudToUsd]);

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
    setIsAudToUsd(!isAudToUsd);
    setAmount('0');
  };

  const animatedBulgeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: swapScale.value }
      ],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: leftBgColor }]}>
      <StatusBar barStyle={isAudToUsd ? "dark-content" : "light-content"} backgroundColor="transparent" translucent />
      
      {/* Top Split Panels */}
      <View style={styles.splitContainer}>
        
        {/* LEFT PANEL */}
        <View style={[styles.panel, { backgroundColor: leftBgColor, paddingTop: insets.top }]}>
          <View style={styles.headerRowLeft}>
            <Text style={[styles.headerLogo, { color: leftTextColor }]}>AUDxUSD</Text>
          </View>
          <View style={styles.currencyDisplay}>
            <View style={styles.currencyLabelRow}>
               <Text style={styles.flag}>{isAudToUsd ? '🇦🇺' : '🇺🇸'}</Text>
               <Text style={[styles.currencyLabel, { color: leftSubTextColor }]}>{isAudToUsd ? 'AUD' : 'USD'}</Text>
            </View>
            <Text style={[styles.amountText, { color: leftTextColor }]} numberOfLines={1} adjustsFontSizeToFit>
              ${formatNumber(amount)}
            </Text>
          </View>
        </View>

        {/* RIGHT PANEL */}
        <View style={[styles.panel, { backgroundColor: rightBgColor, paddingTop: insets.top }]}>
          <View style={styles.headerRowRight}>
          </View>
          <View style={styles.currencyDisplay}>
            <View style={styles.currencyLabelRow}>
               {/* No flag strictly in the right panel image usually, but adding for clarity */}
               <Text style={[styles.currencyLabel, { color: rightSubTextColor }]}>{isAudToUsd ? 'USD' : 'AUD'}</Text>
            </View>
            <Text style={[styles.amountTextRight, { color: rightTextColor }]} numberOfLines={1} adjustsFontSizeToFit>
              ${formatNumber(convertedAmount)}
            </Text>
          </View>
        </View>

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
        
        {/* Operator Row */}
        <View style={[styles.operatorRow, { backgroundColor: leftOverlayColor }]}>
          {['+', '×', '+', '-'].map((op, i) => ( // Using the exact operators from the user's reference image
            <Pressable key={i} style={[styles.opButton, { borderColor: leftBorderColor }]}>
              <Text style={[styles.opText, { color: leftTextColor }]}>{op}</Text>
            </Pressable>
          ))}
        </View>

        {/* Numpad Grid */}
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
                    <Ionicons name="backspace-outline" size={20} color={leftTextColor} />
                  ) : (
                    <Text style={[styles.keyText, { color: leftTextColor }]}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

      </View>
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
    paddingBottom: 24,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSettings: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  currencyDisplay: {
    alignItems: 'flex-start',
  },
  currencyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flag: {
    fontSize: 14,
    marginRight: 4,
  },
  currencyLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '500',
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  amountTextRight: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  swapWrapper: {
    position: 'absolute',
    left: '50%',
    bottom: 52, // Align roughly with where the middle of the currency text sits
    zIndex: 10,
    transform: [{ translateY: 25 }],
  },
  swapBulge: {
    position: 'absolute', // Ensures we can perfectly center it
    left: -25, // Move left by half width to center on the split
    top: -25, // Move up by half height to center on the bottom line calculation
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  numpadContainer: {
  },
  operatorRow: {
    flexDirection: 'row',
    height: 48,
  },
  opButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  opText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  keypadGrid: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyButton: {
    flex: 1,
    height: 64, // Taller buttons for easy thumb tapping as per image proportions
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
  },
});
