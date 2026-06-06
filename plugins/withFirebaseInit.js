const { withMainApplication } = require('@expo/config-plugins');

/**
 * Config plugin to initialize Firebase in MainApplication.kt
 * This ensures Firebase is initialized before Expo notifications try to use it
 */
const withFirebaseInit = (config) => {
  return withMainApplication(config, (config) => {
    const { modResults } = config;
    const { contents } = modResults;

    // Check if Firebase import already exists
    if (!contents.includes('import com.google.firebase.FirebaseApp')) {
      // Add Firebase import after other imports
      const importRegex = /(import expo\.modules\.ReactNativeHostWrapper)/;
      modResults.contents = contents.replace(
        importRegex,
        `$1\nimport com.google.firebase.FirebaseApp`
      );
    }

    // Check if Firebase initialization already exists
    if (!contents.includes('FirebaseApp.initializeApp')) {
      // Add Firebase initialization in onCreate method
      const onCreateRegex = /(override fun onCreate\(\) \{\s*super\.onCreate\(\))/;
      modResults.contents = modResults.contents.replace(
        onCreateRegex,
        `$1\n\n    // Initialize Firebase for Expo notifications\n    FirebaseApp.initializeApp(this)`
      );
    }

    return config;
  });
};

module.exports = withFirebaseInit;
