import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, Select, MenuItem, 
  FormControl, InputLabel, Button, CircularProgress, Box 
} from '@mui/material';
import axios from 'axios';
import './App.css';



function App() {
  const [letters, setLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [position, setPosition] = useState('first');
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Arabic letters when component mounts
  useEffect(() => {
    async function fetchLetters() {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'https://quran-verse-api.onrender.com/';
        
        const response = await axios.get(`${API_URL}/api/letters`);
        setLetters(response.data.letters);
      } catch (err) {
        // Error handling
      }
    }
    
    fetchLetters();
  }, []);

  const searchVerses = async () => {
    if (!selectedLetter) {
      setError('Please select a letter');
      return;
    }
    
    setLoading(true);
    setError('');
    setVerses([]); // Clear existing verses
    
    try {
      console.log('Searching for verses with:', {
        letter: selectedLetter,
        position: position,
        limit: 5
      });
      
      const response = await axios.get('http://localhost:5000/api/search', {
        params: {
          letter: selectedLetter,
          position: position,
          limit: 5
        }
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.verses && Array.isArray(response.data.verses)) {
        setVerses(response.data.verses);
      } else {
        setVerses([]);
        setError('No verses found matching the criteria');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      setError(`Failed to fetch verses: ${err.message}`);
      setLoading(false);
    }
  };
  
  const loadMoreVerses = async () => {
    if (!selectedLetter) {
      setError('Please select a letter');
      return;
    }
    
    setShowMoreLoading(true);
    setError('');
    
    try {
      // Get IDs of already displayed verses to exclude them
      const excludeIds = verses.map(verse => verse.id).join(',');
      
      const response = await axios.get('http://localhost:5000/api/more_verses', {
        params: {
          letter: selectedLetter,
          position: position,
          limit: 5,
          exclude_ids: excludeIds
        }
      });
      
      if (response.data.verses && Array.isArray(response.data.verses) && response.data.verses.length > 0) {
        // Append new verses to existing ones
        setVerses(prev => [...prev, ...response.data.verses]);
      } else {
        setError('No more verses found matching the criteria');
      }
      
      setShowMoreLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      setError(`Failed to fetch more verses: ${err.message}`);
      setShowMoreLoading(false);
    }
  };

  // Component to highlight words with the letter in the specified position
  const HighlightedText = ({ text, letter, position }) => {
    // Split text into words
    const words = text.split(' ');
    
    // Function to check if a word has the letter in the specified position
    const hasLetterInPosition = (word) => {
      if (position === 'first' && word.startsWith(letter)) return true;
      if (position === 'last' && word.endsWith(letter)) return true;
      if (position === 'middle' && word.length > 2) {
        // Check if letter is in the middle (not first or last character)
        return word.substring(1, word.length - 1).includes(letter);
      }
      return false;
    };
    
    return (
      <div className="quran-text" style={{ textAlign: 'right', direction: 'rtl' }}>
        {words.map((word, index) => (
          <span
            key={index}
            style={{
              backgroundColor: hasLetterInPosition(word) ? '#ffeb3b80' : 'transparent',
              padding: hasLetterInPosition(word) ? '2px' : '0',
              marginRight: '4px',
              display: 'inline-block'
            }}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        Quran Verse Finder
      </Typography>
      
      <Paper elevation={3} style={{ padding: '2rem', marginBottom: '2rem' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Arabic Letter</InputLabel>
              <Select
                value={selectedLetter}
                onChange={(event) => {
                  // Add defensive programming to check if event exists and has expected properties
                  if (event && event.target) {
                    setSelectedLetter(event.target.value);
                  } else {
                    // For MUI v5, sometimes the value is passed directly
                    setSelectedLetter(event);
                  }
                }}
                label="Arabic Letter"
              >
                {letters.map((letter) => (
                  <MenuItem key={letter} value={letter}>
                    {letter}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                label="Position"
              >
                <MenuItem value="first">First</MenuItem>
                <MenuItem value="middle">Middle</MenuItem>
                <MenuItem value="last">Last</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              style={{ height: '100%' }}
              onClick={searchVerses}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <Typography color="error" style={{ marginTop: '1rem' }}>
            {error}
          </Typography>
        )}
      </Paper>
      
      <Typography variant="h5" component="h2" gutterBottom>
        Verses
      </Typography>
      
      {verses.length === 0 && !loading && (
        <Typography align="center" style={{ marginTop: '2rem' }}>
          No verses found. Try a different search.
        </Typography>
      )}
      
      {verses.map((verse) => (
        <Paper key={verse.id} elevation={2} style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <Typography variant="h6" gutterBottom>
            Surah {verse.surah}, Verse {verse.verse_number}
          </Typography>
          
          <HighlightedText 
            text={verse.text} 
            letter={selectedLetter}
            position={position}
          />
          
          <div className="audio-player" style={{ marginTop: '1rem' }}>
            <audio
              controls
              style={{ width: '100%' }}
              src={verse.audio_url}
              onError={(e) => {
                console.log("Audio error, trying fallback");
                e.target.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${verse.id}.mp3`;
              }}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </Paper>
      ))}
      
      {verses.length > 0 && (
        <Box mt={4} mb={6} display="flex" justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={loadMoreVerses}
            disabled={showMoreLoading}
            startIcon={showMoreLoading ? <CircularProgress size={20} /> : null}
          >
            {showMoreLoading ? 'Loading...' : 'Show More Verses'}
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;