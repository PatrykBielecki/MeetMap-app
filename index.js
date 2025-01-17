import { AppRegistry, Platform } from 'react-native';
import 'react-native-url-polyfill/auto'
import App from './App';

AppRegistry.registerComponent('main', () => App);

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') || document.getElementById('main');
    AppRegistry.runApplication('main', { rootTag });
}