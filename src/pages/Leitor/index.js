import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
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

      const id = await AsyncStorage.getItem('@id_aluno');
      setIdAluno(id);

      const savedToken = await AsyncStorage.getItem('@token');
      if (!savedToken) {
        console.warn('Token não encontrado no AsyncStorage.');
      }
      setToken(savedToken);

    //  console.log('Token armazenado:', savedToken); 
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    console.log('Conteúdo bruto do QR:', data);

    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch (parseError) {
      console.error('Erro ao fazer parse do QR:', parseError);
      Alert.alert('Erro', 'O conteúdo do QR Code não é um JSON válido.');
      setScanned(false);
      return;
    }

    console.log('QR Lido:', qrData);

    if (!qrData.id) {
      Alert.alert('Erro', 'QR Code inválido!');
      setScanned(false);
      return;
    }

    const id_chamada = qrData.id;
    const hora_post = moment().tz('America/Cuiaba').toISOString();

    const payload = {
      id_aluno: idAluno,
      id_chamada: id_chamada,
      hora_post: hora_post,
    };

    console.log('Dados enviados no POST:', JSON.stringify(payload, null, 2));

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
      console.log('Resposta da API:', {
        status: response.status,
        headers: response.headers,
        body: responseText,
      });

      if (response.ok) {
        Alert.alert('Sucesso', `Chamada registrada!\nResposta: ${responseText}`);
        navigation.navigate('Home');
      } else {
        Alert.alert(
          'Erro ao registrar chamada',
          `Status: ${response.status}\nResposta: ${responseText}`
        );
        setScanned(false);
      }
    } catch (erro) {
      console.error('Erro QR:', erro);
      Alert.alert('Erro', `QR inválido ou erro de rede: ${erro.message}`);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Solicitando permissão para câmera...</Text>;
  }
  if (hasPermission === false) {
    return <Text>Sem acesso à câmera.</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <Text style={styles.instrucao}>Aponte para o QR Code</Text>
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
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 10,
  },
  instrucao: {
    color: '#fff',
    fontSize: 16,
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
