// utils/groupAvatar.js
// Generate a random dark color pattern for group avatar

export const generateGroupAvatar = (groupName) => {
  // Generate a consistent color based on group name with more variety
  const colors = [
    { bg: "240 10% 12%", pattern: "240 10% 25%" }, // Dark gray-blue
    { bg: "0 0% 8%", pattern: "0 0% 20%" }, // Dark black-red
    { bg: "280 15% 10%", pattern: "280 15% 22%" }, // Dark purple
    { bg: "200 20% 10%", pattern: "200 20% 24%" }, // Dark cyan-blue
    { bg: "340 15% 10%", pattern: "340 15% 22%" }, // Dark pink-red
    { bg: "160 20% 10%", pattern: "160 20% 24%" }, // Dark teal-green
    { bg: "30 20% 10%", pattern: "30 20% 24%" }, // Dark orange
    { bg: "270 15% 10%", pattern: "270 15% 22%" }, // Dark violet
    { bg: "210 20% 10%", pattern: "210 20% 24%" }, // Dark blue
    { bg: "120 15% 10%", pattern: "120 15% 22%" }, // Dark green
  ];

  // Use group name to consistently select a color
  const hash = groupName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const colorIndex = Math.abs(hash) % colors.length;
  const selectedColor = colors[colorIndex];

  return {
    backgroundColor: selectedColor.bg,
    patternColor: selectedColor.pattern,
  };
};

export const GroupAvatar = ({ groupName, className = "" }) => {
  const { backgroundColor, patternColor } = generateGroupAvatar(groupName);

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundColor: `hsl(${backgroundColor})`,
        backgroundImage: `
          linear-gradient(45deg, hsl(${patternColor}) 25%, transparent 25%),
          linear-gradient(-45deg, hsl(${patternColor}) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, hsl(${patternColor}) 75%),
          linear-gradient(-45deg, transparent 75%, hsl(${patternColor}) 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
    />
  );
};
