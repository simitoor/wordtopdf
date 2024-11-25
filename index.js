const express = require("express");
const multer = require("multer");
const cors = require("cors");
const puppeteer = require("puppeteer");
const mammoth = require("mammoth");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors());

// setting up the file storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads");
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

// POST route to handle file conversion
app.post("/convertFile", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        // Read DOCX file and convert it to HTML using Mammoth
        const docxFile = fs.readFileSync(req.file.path);
        const { value: htmlContent } = await mammoth.convertToHtml({ buffer: docxFile });

        // Define output PDF file path
        let outputPath = path.join(__dirname, "files", `${req.file.originalname}.pdf`);

        // Use Puppeteer to convert the HTML to PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        await page.pdf({ path: outputPath, format: "A4" });
        await browser.close();

        // Send the generated PDF to the user for download
        res.download(outputPath, () => {
            console.log("File downloaded");
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});