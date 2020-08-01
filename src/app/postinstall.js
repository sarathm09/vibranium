const { join } = require('path')
const { readFile, writeFile, readdir } = require('fs').promises

/**
 * Copy the latest report html files from the vibranium report UI repo
 */
const copyReportFiles = async () => {
    try {
        let src = join(__dirname, '..', '..', 'node_modules', 'vibranium-report-ui', 'dist-ui')
        let files = await readdir(src)
        for (const file of files) {
            let contents = await readFile(join(src, file), 'utf-8')
            await writeFile(join(__dirname, '..', 'res', 'ui', file), contents)
        }
    } catch (e) {
        console.error(`An error occurred in copying the report html files. Log: ${e}`)
    }
}


console.log(`Copying report files: started`)
copyReportFiles()
console.log(`Copying report files: done`)