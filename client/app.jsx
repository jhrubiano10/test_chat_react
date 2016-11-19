'use strict';
const React  = require('react'), 
	  socket = io.connect();
	  
let UsersList = React.createClass({
	render()
	{
		return (
			<div>
				<div className = 'hoption'>
                	<h4>Usuarios conectados.</h4>
                </div>
				<div className = 'conectados'>
					{
						this.props.users.map((user, i) => {
							return (
										<div key = {i} className = 'cases'>
											<div className = 'foto'> 
												<img src = 'img/user_online.png'/>
											</div> 
											<div className = 'nombre'>
												{user}
											</div>
										</div>
							);
						})
					}
				</div>				
			</div>
		);
	}
});

let Message = React.createClass({
	render() {
		return (
			<div className = 'mensajeChat'>
				<div className = 'nombremensaje'>{this.props.user}</div>{this.props.text}
			</div>
		);
	}
});

let MessageList = React.createClass({
	render() {
		return (
			<div className = 'historial'>
				{
					this.props.messages.map((message, i) => {
						return (
							<Message
								key={i}
								user={message.user}
								text={message.text} 
							/>
						);
					})
				} 
			</div>
		);
	}
});

let MessageForm = React.createClass({

	getInitialState() {
		return {text: ''};
	},

	handleSubmit(e)
	{
		e.preventDefault(); 
		let message = {
			user : this.props.user,
			text : this.state.text
		};
		this.props.onMessageSubmit(message);
		//Notificaciones Nativas del navegador...
		this.setState({ text: '' });
	},

	changeHandler(e)
	{
		this.setState({ text : e.target.value });
	},

	render() {
		return(
			<div>
				<form onSubmit={this.handleSubmit} className = 'form-group'>
					<input
						className = 'form-control'
						onChange={this.changeHandler}
						value={this.state.text}
						placeholder="Escribe tu mensaje"
					/>
				</form>
			</div>
		);
	}
});

var ChangeNameForm = React.createClass(
{
	getInitialState()
	{
		return {newName: ''};
	},

	onKey(e)
	{
		this.setState({ newName : e.target.value });
	},

	handleSubmit(e)
	{
		e.preventDefault();
		let newName = this.state.newName;
		this.props.onChangeName(newName);	
		this.setState({ newName: '' });
	},
	render() {
		return(
			<div className='change_name_form'>
				<form onSubmit={this.handleSubmit}>
					<input
						onChange = {this.onKey}
						value={this.state.newName}
						className = 'form-control'
						placeholder = 'Cambiar Nombre'
					/>
				</form>	
			</div>
		);
	}
});

var ChatApp = React.createClass({

	getInitialState()
	{
		return {users: [], messages:[], text: ''};
	},

	componentDidMount()
	{
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageRecieve);
		socket.on('user:join', this._userJoined);
		socket.on('user:left', this._userLeft);
		socket.on('change:name', this._userChangedName);
		if (Notify.needsPermission) 
		{
			try
			{
				Notify.requestPermission(onPermissionGranted, onPermissionDenied);    
			}
			catch(e)
			{
				console.log("No ha sido posible activar las notificaciones");           
			}
		}
		function onPermissionGranted()
		{
			console.log("Las notificaciones han sido activadas correctamente");	    	    
		}
		function onPermissionDenied()
		{
			console.warn("Se ha denegado las notificaciones por parte del usuario");
		}
	},

	_initialize(data)
	{
		var {users, name} = data;
		this.setState({users, user: name});
	},

	_messageRecieve(message)
	{
		let myNotification = new Notify(message.user, 
		{
			body: message.text,
			tag: message.user,
			timeout: 5,  
			icon : "img/user_online.png",
			notifyClick : () => 
			{
				window.focus();
				myNotification.close();
			}
		});
		myNotification.show();
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
	},

	_userJoined(data)
	{
		var {users, messages} = this.state;
		var {name} = data;
		users.push(name);
		messages.push({
			user: 'APPLICATION BOT',
			text : name +' Se ha unido'
		});
		this.setState({users, messages});
	},

	_userLeft(data) {
		var {users, messages} = this.state;
		var {name} = data;
		var index = users.indexOf(name);
		users.splice(index, 1);
		messages.push({
			user: 'APPLICATION BOT',
			text : name +' ha dejado el chat'
		});
		this.setState({users, messages});
	},

	_userChangedName(data) {
		var {oldName, newName} = data;
		var {users, messages} = this.state;
		var index = users.indexOf(oldName);
		users.splice(index, 1, newName);
		messages.push({
			user: 'APPLICATION BOT',
			text : 'Se ha cambiado el nombre  : ' + oldName + ' ==> '+ newName
		});
		this.setState({users, messages});
	},

	handleMessageSubmit(message)
	{
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
		socket.emit('send:message', message);
	},

	handleChangeName(newName) {
		var oldName = this.state.user;
		socket.emit('change:name', { name : newName}, (result) => {
			if(!result) {
				return alert('There was an error changing your name');
			}
			var {users} = this.state;
			var index = users.indexOf(oldName);
			users.splice(index, 1, newName);
			this.setState({users, user: newName});
		});
	},

	render() {
		return (
			<div className = 'table-layout'>
				
				<div className = 'table-cell fixed-width-200'>
					<div ref={(ref) => this._div = ref} />
					<UsersList
						users={this.state.users}
					/>
				</div>
				<div className = 'table-cell'>
					<MessageList
						messages={this.state.messages}
					/>
					<ChangeNameForm
						onChangeName={this.handleChangeName}
					/>
					<MessageForm
						onMessageSubmit={this.handleMessageSubmit}
						user={this.state.user}
					/>
				</div>
			</div>
		);
	}
});

React.render(<ChatApp/>, document.getElementById('app'));