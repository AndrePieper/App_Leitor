import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, TextInput, TouchableOpacity, Image, Keyboard } from 'react-native';
import * as Device from 'expo-device';
import axios from 'axios';
import grupoFasipe from './grupo-fasipe.png';
import { Form } from '@unform/mobile';
import { BoxForm, Container } from './styles';

export default function Login({ navigation }) {
  const formRef = useRef(null);
  const [Sev, setSev] = useState(null);
  const [DadosLogin, setDadosLogin] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [imei, setImei] = useState('1');
  const [mensagemErro, setMensagemErro] = useState(''); 
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  useEffect(() => {
    const obterImei = () => {
      const imeiDispositivo = Device.osInternalBuildId || '1';
      setImei(imeiDispositivo);
    };
    obterImei(); 
  
    const MostrarTeclado = Keyboard.addListener('keyboardDidShow', () => {
      setTecladoVisivel(true);
    });
    const EsconderTeclado = Keyboard.addListener('keyboardDidHide', () => {
      setTecladoVisivel(false);
    });
  
    return () => {
      EsconderTeclado.remove();
      MostrarTeclado.remove();
    };
  }, []); 

  useEffect(() => {
    async function carregarEmail() {
      const emailSalvo = await AsyncStorage.getItem('@email');
      if (emailSalvo) {
        setDadosLogin((prev) => ({
          ...prev,
          email: emailSalvo,
        }));
      }
    }
    carregarEmail();
  }, []);
  
  useEffect(() => {
    if (imei) {
      setDadosLogin((prevValues) => ({
        ...prevValues,
        imei,
      }));
    }
  }, [imei]); 

  function Texto_Input(input) {
    setDadosLogin((prevValues) => ({
      ...prevValues,
      [input.name]: input.value,
    }));
  }

  async function Logar() { 
    if (DadosLogin.imei && DadosLogin.email && DadosLogin.senha) {
      setCarregando(true);
      setSev(null); 
  
      try {
        const api_url = "https://projeto-iii-4.vercel.app/login/app"; 
        const headers = { 'Content-Type': 'application/json' };  
  
        console.log("🔵 Dados enviados no POST:", JSON.stringify(DadosLogin, null, 2));
  
        const resposta = await axios.post(api_url, DadosLogin, { headers: headers });
  
        console.log("🟢 Resposta da API:", resposta.status, JSON.stringify(resposta.data, null, 2));
  
        setCarregando(false);
  
        if (resposta.status === 200 && resposta.data.auth) {
          if (resposta.data.token) {
            await AsyncStorage.setItem('@token', resposta.data.token);
            console.log('🔑 Token armazenado:', resposta.data.token);
            navigation.navigate('Home');
          } else {
            setSev("erro");
            setMensagemErro("Token não encontrado");
          }
        } else {
          setSev("erro");
          setMensagemErro(resposta.data.message || 'Erro desconhecido!');
        }
      } catch (erro) {
        setCarregando(false);
        setSev("erro");
  
        const mensagemErro = erro.response?.data?.message || 'Erro desconhecido!';
        console.log("🔴 Erro na requisição:", mensagemErro, erro.response?.status, erro.response?.data);
  
        setMensagemErro(mensagemErro);
      }
    }
  }
  

  return (
    <Container>
      <StatusBar backgroundColor={"#00913D"} />
      <Image source={grupoFasipe} style={styles.logo} />

      <BoxForm style={styles.boxForm}>
        <Form ref={formRef} onSubmit={Logar}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "email", value: e })}
            value={DadosLogin.email || ""}
            name="email"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "senha", value: e })}
            value={DadosLogin.senha || ""}
            name="senha"
            secureTextEntry={true}
          />

          {Sev === "erro" && mensagemErro && (
            <Text style={styles.erro}>
              {mensagemErro}
            </Text>
          )}

          <TouchableOpacity onPress={() => {
            formRef.current.submitForm();
          }}>
            <View style={styles.botaoPadrao}>
              <Text style={styles.botaoPadraoTexto}>Entrar</Text> 
            </View>
          </TouchableOpacity>

          {carregando && (
            <ActivityIndicator size="large" color="#00913D" style={styles.carregar} />
          )}
        </Form>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.linkCadastro}>Cadastrar-se</Text>
        </TouchableOpacity>

      </BoxForm>

      {!tecladoVisivel && (
        <View style={styles.rodape}>
          <View style={styles.rodapeRow}>
            <View style={styles.rodapeLinha}></View>
            <Text style={styles.rodapeTexto}>Chamada Fasipe</Text>
            <View style={styles.rodapeLinha}></View>
          </View>
        </View>
      )}

      {/* BOTÃO PROVISÓRIO PARA IR DIRETO PARA HOME*/} 
      {/*
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.botaoProvisorio}>
        <Text style={styles.textoProvisorio}>IR PARA HOME (PROVISÓRIO)</Text>
      </TouchableOpacity>  
      */}
    
    </Container>
  );
}

const styles = StyleSheet.create({
  logo: { width: 400, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 20 },
  boxForm: { marginBottom: 0 },
  label: { color: "#000", margin: 5 },
  input: { backgroundColor: "#fff", color: "#737276", borderWidth: 1, borderColor: "#737276", borderRadius: 5, margin: 5, padding: 10 },
  erro: { color: 'red', textAlign: 'center', marginVertical: 10 },
  botaoPadrao: { backgroundColor: "#00913D", alignItems: 'center', padding: 15, margin: 5, marginTop: 20, borderRadius: 5, marginHorizontal: 20, marginBottom: 20 },
  botaoPadraoTexto: { color: "#fff", fontSize: 18 },
  carregar: { marginBottom: 10, marginTop: 10 },
  rodape: { position: 'absolute', flex: 0.1, left: 0, right: 0, bottom: 25 },
  rodapeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  rodapeLinha: { borderBottomWidth: 2, borderColor: "#000", width: '20%', marginHorizontal: 5 },
  rodapeTexto: { color: "#000", textAlign: "center", fontSize: 16 },
  linkCadastro: { color: '#0000FF', textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
  botaoProvisorio: { backgroundColor: '#FF0000', alignItems: 'center', padding: 15, margin: 10, borderRadius: 5 },
  textoProvisorio: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
