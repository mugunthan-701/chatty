const socket = io('http://localhost:2000')

socket.on('chat-message',data=>{
    console.log(data)
})