const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Config plugin to override Stripe Android version
 * This prevents Gradle from using dynamic version 21.22.+ which checks JitPack and times out
 */
const withStripeVersion = (config) => {
  return withGradleProperties(config, (config) => {
    // Override StripeSdk_stripeVersion to use exact version instead of dynamic 21.22.+
    config.modResults.push({
      type: 'property',
      key: 'StripeSdk_stripeVersion',
      value: '21.22.0',
    });

    return config;
  });
};

module.exports = withStripeVersion;
