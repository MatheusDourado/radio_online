document.addEventListener('DOMContentLoaded', () => {
	const audio = document.getElementById('audio');
	const musicCircle = document.getElementById('musicCircle');
	const songTitle = document.getElementById('songTitle');
	const artistName = document.getElementById('artistName');
	const songYear = document.getElementById('songYear');
	const searchButton = document.getElementById('searchButton');
	const searchQuery = document.getElementById('searchQuery');
	const tracksList = document.getElementById('tracksList');
	let audioContext;
	let analyser;
	let dataArray;
	let bufferLength;

	// Seu Client ID do Jamendo
	const CLIENT_ID = '7c55418e'; // Substitua pelo seu Client ID

	// Função para buscar músicas
	async function searchTracks(query) {
		try {
			const response = await fetch(
				`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=10&namesearch=${encodeURIComponent(
					query,
				)}&include=musicinfo&audioformat=mp32`,
			);
			if (!response.ok) {
				throw new Error('Erro ao buscar faixas');
			}
			const data = await response.json();
			return data.results;
		} catch (error) {
			console.error('Erro:', error);
			alert(
				'Não foi possível buscar as faixas. Verifique o console para mais detalhes.',
			);
			return [];
		}
	}

	// Função para exibir a lista de músicas
	function displayTracks(tracks) {
		tracksList.innerHTML = ''; // Limpa resultados anteriores
		if (tracks.length === 0) {
			const li = document.createElement('li');
			li.textContent = 'Nenhuma faixa encontrada.';
			tracksList.appendChild(li);
			return;
		}
		tracks.forEach((track) => {
			const li = document.createElement('li');
			li.textContent = `${track.name} - ${track.artist_name}`;
			li.dataset.trackUrl = track.audiodownload || track.audio;
			li.dataset.trackTitle = track.name;
			li.dataset.trackArtist = track.artist_name;
			li.dataset.trackYear = track.release_date
				? track.release_date.split('-')[0]
				: 'Ano Desconhecido';
			li.dataset.trackImage = track.image
				? track.image
				: 'https://via.placeholder.com/300'; // Imagem padrão
			tracksList.appendChild(li);
		});
	}

	// Evento de busca
	searchButton.addEventListener('click', async () => {
		const query = searchQuery.value.trim();
		if (query === '') {
			alert('Por favor, insira um termo de busca.');
			return;
		}
		const tracks = await searchTracks(query);
		displayTracks(tracks);
	});

	// Evento de seleção de música
	tracksList.addEventListener('click', async (e) => {
		if (
			e.target &&
			e.target.nodeName === 'LI' &&
			e.target.dataset.trackUrl
		) {
			await playTrack(e.target);
		}
	});

	async function playTrack(trackElement) {
		// Atualizar informações da música
		songTitle.textContent = trackElement.dataset.trackTitle;
		artistName.textContent = trackElement.dataset.trackArtist;
		songYear.textContent = trackElement.dataset.trackYear;

		// Atualizar a capa da música
		const coverUrl = trackElement.dataset.trackImage;
		musicCircle.style.backgroundImage = `url('${coverUrl}')`;

		// Atualizar o elemento de áudio
		audio.src = trackElement.dataset.trackUrl;

		// Inicializar o AudioContext e AnalyserNode se ainda não estiverem configurados
		if (!audioContext) {
			audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			const source = audioContext.createMediaElementSource(audio);
			analyser = audioContext.createAnalyser();
			source.connect(analyser);
			analyser.connect(audioContext.destination);

			// Configurar o AnalyserNode
			analyser.fftSize = 256;
			bufferLength = analyser.frequencyBinCount;
			dataArray = new Uint8Array(bufferLength);
		}

		// Tentar reproduzir o áudio após a interação do usuário
		try {
			await audio.play();
			// Adicionar animação das ondas sonoras quando a música está tocando
			musicCircle.classList.add('animate-wave');
			// Iniciar a animação visual
			animateCircle();
		} catch (error) {
			console.error('Erro ao reproduzir áudio:', error);
			alert('Não foi possível reproduzir a faixa selecionada.');
			return;
		}

		function animateCircle() {
			requestAnimationFrame(animateCircle);

			// Obter dados de frequência
			analyser.getByteFrequencyData(dataArray);

			// Calcular a média dos valores de frequência para representar a amplitude geral
			let sum = 0;
			for (let i = 0; i < bufferLength; i++) {
				sum += dataArray[i];
			}
			const average = sum / bufferLength;

			// Escalar a amplitude para um valor adequado para transformação
			const scale = average / 128; // Valor médio de amplitude é 128

			// Aplicar uma transformação ao círculo com base na amplitude
			musicCircle.style.transform = `scale(${1 + scale * 0.1})`; // Ajuste o multiplicador conforme necessário
		}

		// Remover a animação quando a música parar
		audio.onended = () => {
			musicCircle.classList.remove('animate-wave');
		};
	}

	// Adicionar listener para pausar a animação quando o usuário pausa a música
	audio.addEventListener('pause', () => {
		musicCircle.classList.remove('animate-wave');
	});
});
