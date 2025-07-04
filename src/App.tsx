// import { useEffect, useState } from "react";
// import type { Schema } from "../amplify/data/resource";
// import { useAuthenticator } from '@aws-amplify/ui-react';
// import { generateClient } from "aws-amplify/data";

// const client = generateClient<Schema>();

// function App() {
//   const { user, signOut } = useAuthenticator();
    
//   function deleteTodo(id: string) {
//     client.models.Todo.delete({ id });
//   }
//   const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

//   useEffect(() => {
//     client.models.Todo.observeQuery().subscribe({
//       next: (data) => setTodos([...data.items]),
//     });
//   }, []);

//   function createTodo() {
//     client.models.Todo.create({ content: window.prompt("Todo content") });
//   }

//   return (
//     <main>
//             <h1>{user?.signInDetails?.loginId}'s Mis Notas</h1>
//       <button onClick={createTodo}>+ new</button>
//       <ul>
//         {todos.map((todo) => (
//           <li onClick={() => deleteTodo(todo.id)} key={todo.id}>
//             {todo.content}
//           </li>
//         ))}
//       </ul>
//       <button onClick={signOut}>Sign out</button>
//     </main>
//   );
// }

// export default App;





import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, list, remove } from 'aws-amplify/storage';

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema['Todo']['type']>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [uploading, setUploading] = useState(false);

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    // Load existing files
    loadFiles();
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt('Todo content') });
  }

  // File upload function
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to media/ path (authenticated users can read/write)
      const result = await uploadData({
        path: `media/${file.name}`,
        data: file,
      });

      console.log('Upload successful:', result);

      // Refresh the file list
      loadFiles();

      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  // Load files from S3
  const loadFiles = async () => {
    try {
      const result = await list({
        path: 'media/',
      });

      // Get URLs for each file
      const filesWithUrls = await Promise.all(
        result.items.map(async (item) => {
          const url = await getUrl({
            path: item.path,
          });
          return {
            name: item.path.replace('media/', ''),
            url: url.url.toString(),
          };
        })
      );

      setUploadedFiles(filesWithUrls);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  // Delete file from S3
  const deleteFile = async (fileName: string) => {
    try {
      await remove({
        path: `media/${fileName}`,
      });

      // Refresh the file list
      loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>{user?.signInDetails?.loginId}'s Mis Notas</h1>

      {/* Todo Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Todos</h2>
        <button onClick={createTodo}>+ new todo</button>
        <ul>
          {todos.map((todo) => (
            <li
              onClick={() => deleteTodo(todo.id)}
              key={todo.id}
              style={{ cursor: 'pointer', margin: '5px 0' }}
            >
              {todo.content}
            </li>
          ))}
        </ul>
      </div>

      {/* File Upload Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>File Storage</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          {uploading && (
            <span style={{ marginLeft: '10px' }}>Uploading...</span>
          )}
        </div>

        {/* Display uploaded files */}
        <div>
          <h3>Uploaded Files ({uploadedFiles.length})</h3>
          {uploadedFiles.length === 0 ? (
            <p>No files uploaded yet</p>
          ) : (
            <ul>
              {uploadedFiles.map((file) => (
                <li
                  key={file.name}
                  style={{
                    margin: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ marginRight: '10px' }}>{file.name}</span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: '10px', color: 'blue' }}
                  >
                    View
                  </a>
                  <button
                    onClick={() => deleteFile(file.name)}
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      border: 'none',
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;