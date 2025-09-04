import mongoose from "mongoose";
import colors from "colors";

// MongoDB connection function with colorful logging
const connectToMongoDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(
        colors.green.bold("✓ ") + 
        colors.green("Connected to ") + 
        colors.cyan.bold("MongoDB") + 
        colors.green(" successfully! 🎉")
      );
    } catch (err) {
      console.error(
        colors.red.bold("✗ ") + 
        colors.red("MongoDB connection error: ") + 
        colors.yellow(err.message || err)
      );
      process.exit(1);
    }
  };

  export default connectToMongoDB;