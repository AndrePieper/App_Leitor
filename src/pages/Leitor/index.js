import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';

export default function Leitor({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [idAluno, setIdAluno] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('Permissão de localização negada');
        return;
      }

      const id = await AsyncStorage.getItem('@id_aluno');
      setIdAluno(id);

      const savedToken = await AsyncStorage.getItem('@token');
      setToken(savedToken);
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch {
      Alert.alert('QR Code inválido!');
      setScanned(false);
      return;
    }

    if (!qrData.id) {
      Alert.alert('QR Code inválido!');
      setScanned(false);
      return;
    }

    const id_chamada = qrData.id;
    const hora_post = moment().tz('America/Cuiaba').toISOString();

    let coords = { latitude: null, longitude: null };
    try {
      const location = await Location.getCurrentPositionAsync({});
      coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (err) {
      Alert.alert('Erro ao obter localização', err.message);
    }

    const payload = {
      id_aluno: idAluno,
      id_chamada: id_chamada,
      hora_post: hora_post,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    try {
      const response = await fetch('https://projeto-iii-4.vercel.app/chamada/alunos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (response.ok) {
        Alert.alert('Sucesso', 'Chamada registrada!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro ao registrar chamada', responseText);
        setScanned(false);
      }
    } catch (erro) {
      Alert.alert('Erro', `QR inválido ou erro de rede: ${erro.message}`);
      setScanned(false);
    }
  };

  if (hasPermission === null) return <Text>Solicitando permissão para câmera...</Text>;
  if (hasPermission === false) return <Text>Sem acesso à câmera.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      <View style={styles.maskContainer}>
        <View style={styles.maskTop} />
        <View style={styles.maskCenter}>
          <View style={styles.maskSide} />
          <View style={styles.scanArea} />
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom}>
          <Text style={styles.instrucao}>Aponte para o QR Code</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.botaoPadrao}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.botaoPadraoTexto}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  maskContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskCenter: {
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#000000',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrucao: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  botaoPadrao: {
    backgroundColor: '#00913D',
    alignItems: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 5,
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  botaoPadraoTexto: {
    color: '#fff',
    fontSize: 18,
  },
});
