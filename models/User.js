const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    }
})

const UserModel = mongoose.model('User', userSchema);

class User {
    constructor(username, password){
        this.username = username;
        this.password = password;
    }

    async saveUser(){
        const user = new UserModel({ username: this.username, password: this.password});
        return await user.save();   
    }

    static async findOne(query) {
        return await UserModel.findOne(query);
    }

    static async findByUsername(username){
        return await UserModel.findOne({username: username});
    }

    

    static async findById(id) {
        return await UserModel.findOne({_id: id});
    }

    
}

module.exports = User;