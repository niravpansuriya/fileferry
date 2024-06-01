import logo from './logo.svg';
import './App.css';
import FileSelector from './components/FileSelector';
import './services/socket';
import './services/webrtc';
import { Provider } from 'react-redux';
import store from './redux/store';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileTable from './components/FileTable';

function App() {
	return (
		<Provider store={store}>
			<Router>
				<Routes>
					<Route path="/" exact element={<FileSelector />} />
					<Route path="/receive/:socketId" element={<FileTable />} />
				</Routes>
			</Router>
		</Provider>
	);
}

export default App;
