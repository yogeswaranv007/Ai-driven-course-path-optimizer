/**
 * Parse device information from user-agent string
 */
const parseDeviceInfo = (userAgent, ip) => {
  if (!userAgent) {
    return {
      userAgent: 'Unknown',
      ip: ip || 'Unknown',
      device: 'Unknown',
      browser: 'Unknown',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device type
  let device = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = 'Tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    device = 'Mobile';
  }

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  } else if (ua.includes('trident')) {
    browser = 'Internet Explorer';
  }

  return {
    userAgent,
    ip: ip || 'Unknown',
    device,
    browser,
  };
};

module.exports = { parseDeviceInfo };
