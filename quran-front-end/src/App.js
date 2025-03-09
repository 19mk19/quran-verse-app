import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, Select, MenuItem, 
  FormControl, InputLabel, Button, CircularProgress, Box 
} from '@mui/material';
import axios from 'axios';
import './App.css';

function App() {
  // Define backend URL at the component level so it's accessible to all functions
  const backendUrl = 'https://quran-verse-api.onrender.com';
  console.log('Using backend URL:', backendUrl);
  
  const [letters, setLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [position, setPosition] = useState('first');
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const [error, setError] = useState('');
  const [lettersLoading, setLettersLoading] = useState(true);
  
  // Pre-warm the backend to minimize cold start delay
  useEffect(() => {
    const prewarmBackend = async () => {
      try {
        console.log('Pre-warming backend...');
        await axios.get(`${backendUrl}`);
        console.log('Pre-warm request sent');
      } catch (err) {
        console.log('Pre-warming backend attempt made');
      }
    };
    
    prewarmBackend();
  }, [backendUrl]);
  
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await axios.post(`${backendUrl}/api/track-visit`, {
          path: window.location.pathname
        });
      } catch (err) {
        console.log('Visit tracking error (non-critical)');
      }
    };
    
    trackVisit();
  }, [backendUrl]);

  // Test backend connectivity
  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log('Testing backend connection...');
        const response = await axios.get(`${backendUrl}`);
        console.log('Backend is accessible:', response.data);
      } catch (err) {
        console.error('Backend test failed:', err.message);
      }
    };
    
    testBackend();
  }, [backendUrl]);

  // Fetch Arabic letters when component mounts
  useEffect(() => {
    async function fetchLetters() {
      setLettersLoading(true); // Set loading to true at start
      try {
        console.log('Fetching Arabic letters from:', `${backendUrl}/api/letters`);
        const response = await axios.get(`${backendUrl}/api/letters`);
        console.log('Letters response:', response.data);
        setLetters(response.data.letters);
      } catch (err) {
        console.error('Error fetching letters:', err);
        setError('Failed to load Arabic letters: ' + err.message);
        // Fallback letters
        setLetters(['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 
                  'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 
                  'ن', 'ه', 'و', 'ي']);
      } finally {
        setLettersLoading(false); // Set loading to false when done
      }
    }
    
    fetchLetters();
  }, [backendUrl]);

  const searchVerses = async () => {
    // Track the search
  try {
    await axios.post(`${backendUrl}/api/track-search`, {
      letter: selectedLetter,
      position: position
    });
  } catch (err) {
    console.log('Search tracking error (non-critical)');
  }
    
    if (!selectedLetter) {
      setError('Please select a letter');
      return;
    }
    
    setLoading(true);
    setError('');
    setVerses([]); // Clear existing verses
    
    try {
      console.log('Searching for verses with:', {
        api: backendUrl,
        letter: selectedLetter,
        position: position,
        limit: 5
      });
      
      const response = await axios.get(`${backendUrl}/api/search`, {
        params: {
          letter: selectedLetter,
          position: position,
          limit: 5
        }
      });
      
      console.log('API Response received:', response.data);
      
      if (response.data.verses && Array.isArray(response.data.verses)) {
        setVerses(response.data.verses);
      } else {
        setVerses([]);
        setError('No verses found matching the criteria');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('API Error details:', {
        message: err.message,
        url: `${backendUrl}/api/search`,
        config: err.config,
        response: err.response
      });
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
      
      const response = await axios.get(`${backendUrl}/api/more_verses`, {
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
      // Remove diacritical marks for better matching
      const cleanWord = word.normalize('NFD')
        .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '');
      
      if (position === 'first' && cleanWord.startsWith(letter)) return true;
      if (position === 'last' && cleanWord.length > 0 && cleanWord[cleanWord.length - 1] === letter) return true;
      if (position === 'middle' && cleanWord.length > 2) {
        // Check if letter is in the middle (not first or last character)
        return cleanWord.substring(1, cleanWord.length - 1).includes(letter);
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
        Quran Verses by Arabic Letters
      </Typography>
      

      <Typography variant="subtitle1" align="center" gutterBottom sx={{ mb: 3 }}>
        Hear how Arabic letters sound at the beginning, middle, or end of words
      </Typography>

      {lettersLoading ? (
        <Paper elevation={3} style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" style={{ marginTop: '1rem' }}>
            Loading application...
          </Typography>
        </Paper>
      ) : (
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
      )}
      
      <Typography variant="h5" component="h2" gutterBottom>
        Verses
      </Typography>
      
      {verses.length === 0 && !loading && !lettersLoading && (
      <Typography align="center" style={{ marginTop: '2rem' }}>
        {!selectedLetter 
          ? 'Please select a letter to start your search.' 
          : error 
            ? error 
            : 'Click "Search" to find verses with the selected criteria.'}
        </Typography>   
        )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
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

{/* Footer with prayer and contact info */}
<Box mt={6} mb={4} textAlign="center">
  <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '20px', marginBottom: '20px' }}></div>
  <Typography variant="h6" style={{ marginBottom: '12px', fontWeight: 'normal' }}>
    اللهم صل على سيدنا محمد
  </Typography>
  <Typography variant="body2" color="textSecondary">
    Found an issue? <a href="mailto:your-email@example.com" style={{ color: 'inherit' }}>Contact Us</a>
    
  </Typography>

  <Typography variant="body2" color="textSecondary">
   
    Note: Verses are from the 30th juz (para) exclusively to use shorter verses only. Audio from Mishary Rashid Alafasy.

  </Typography>
</Box>


    </Container>
  );
}

export default App;