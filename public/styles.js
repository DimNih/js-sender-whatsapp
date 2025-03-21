    const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const progress = document.querySelector('.progress');
        const progressBar = document.querySelector('.progress-bar');
        let files = [];

        // Event Listeners
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        // Drag and Drop Handlers
        ['dragover', 'dragenter'].forEach(event => {
            dropArea.addEventListener(event, (e) => {
                e.preventDefault();
                dropArea.classList.add('highlight');
            });
        });

        ['dragleave', 'dragend'].forEach(event => {
            dropArea.addEventListener(event, (e) => {
                e.preventDefault();
                dropArea.classList.remove('highlight');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('highlight');
            handleFiles(e.dataTransfer.files);
        });

        // File Handling
        function handleFiles(selectedFiles) {
            Array.from(selectedFiles).forEach(file => {
                if (!files.some(f => f.name === file.name)) {
                    files.push(file);
                    addFileToList(file);
                }
            });
        }

        function addFileToList(file) {
            const li = document.createElement("li");
            li.className = "file-item";
            li.innerHTML = `
                <div>
                    <span>${file.name}</span>
                    <small>${formatFileSize(file.size)}</small>
                </div>
                <button onclick="removeFile('${file.name}')">🗑️</button>
            `;
            fileList.appendChild(li);
        }

        function removeFile(fileName) {
            files = files.filter(file => file.name !== fileName);
            fileList.innerHTML = '';
            files.forEach(addFileToList);
        }

        // Upload Handler
        async function uploadFiles() {
            const whatsappNumber = document.getElementById('whatsappNumber').value;
            
            if (!whatsappNumber) {
                return showError('Nomor WhatsApp harus diisi!');
            }
            
            if (files.length === 0) {
                return showError('Tidak ada file untuk dikirim!');
            }

            try {
                progressBar.style.display = 'block';
                const formData = new FormData();
                formData.append('number', whatsappNumber);
                files.forEach(file => formData.append('files', file));

                const response = await fetch('/send', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    showSuccess(`Berhasil mengirim ${files.length} file ke ${whatsappNumber}!`);
                } else {
                    showError(result.message || 'Gagal mengirim file');
                }
                
            } catch (error) {
                showError('Error: ' + error.message);
            } finally {
                progressBar.style.display = 'none';
                files = [];
                fileList.innerHTML = '';
            }
        }

        // Helper Functions
        function formatFileSize(bytes) {
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 Byte';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        }

        function showError(message) {
            const alert = document.createElement('div');
            alert.className = 'alert error';
            alert.textContent = message;
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 3000);
        }

        function showSuccess(message) {
            const alert = document.createElement('div');
            alert.className = 'alert success';
            alert.textContent = message;
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 3000);
        }
