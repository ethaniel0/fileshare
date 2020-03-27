'use babel';

import FileshareView from './fileshare-view';
import { CompositeDisposable } from 'atom';

export default {

  fileshareView: null,
  modalPanel: null,
  subscriptions: null,
  socket: null,
  responses: null,

  activate(state) {
    this.fileshareView = new FileshareView(state.fileshareViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.fileshareView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'fileshare:load': () => this.load(),
      'fileshare:saveFile': () => this.saveFile()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.fileshareView.destroy();
  },

  serialize() {
    return {
      fileshareViewState: this.fileshareView.serialize()
    };
  },

  load() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      var name = editor.getTitle();
      var code = editor.getText().split("\n")[0].replace(/"/g, "").trim();
      socket = new WebSocket("wss://atom-fileshare.ethanhorowitz.repl.co", "cover-connection");
      socket.onopen = () =>{
          var msg = {
              type: "file",
              filename: name,
              code: code,
          }
      	socket.send(JSON.stringify(msg));
      }

      responses = {
        "file": (message) => {
          editor.setText(message.file);
          atom.notifications.addInfo("File updated");
        },
        "update": (message) => {
          atom.notifications.addInfo(message.message);
        },
        "error": (message) => {
          atom.notifications.addInfo(message.message);
        }
      }

      socket.onmessage = function (event) {
      	var message = JSON.parse(event.data);
        console.log(message);
        console.log(responses);
        var keys = Object.keys(responses);
        for (var key of keys){
          if (message.type == key){
            responses[key](message);
            break;
          }
        }
      }

    }

  },

  saveFile() {
    let editor
    console.log("saving...");
    if (editor = atom.workspace.getActiveTextEditor()) {
      var name = editor.getTitle();
      var text = editor.getText();
      var code = text.split("\n")[0].replace(/"/g, "").trim();
      var msg = {
        type: "writeFile",
        code: code,
        filename: name,
        content: text
      };
      console.log("saved");
    	socket.send(JSON.stringify(msg));
      responses.update = (message) => {
        atom.notifications.addInfo("File saved");
        responses.update = (message) => {
          console.log("already loaded");
          atom.notifications.addInfo(message.message);
        }
      }

    }
  }

};
