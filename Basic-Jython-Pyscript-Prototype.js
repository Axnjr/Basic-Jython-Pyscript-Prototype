// this.code = this.code.replace(/;/g,/n/)+""
// this.code = this.code.split(regex2).filter(function (s) { return !s.match(/^\s*$/); })
// this.ReadStringGetData()  // => Varibles Map
// this.DetectLoops() // => loops array [ type of loop , start , end , { ...operation.. } ]
// this.DetectFunctions(pointer) // => function stack 
// console.log( this.BracketCheck(")",0,this.code.length,this.code))
//var regex = /\s*(=>|["-+*\][\/\%:\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;

class BuiltInFunctions_DivineLang{
    constructor(){
        this.builtInFunctions = ["print","capitalize","casefold","type()"]
    }

    print(data){ 
        if(typeof(data)==="string"){ console.log(data.replace(/'/g,"").replace(/"/g,"")) }
        else{ console.log(data) }
    }

    capitalize(data){ console.log(data.toUpperCase()) }

    casefold(data){ console.log(data.toLowerCase()) }

    type(data){ 
        if(isNaN(Number(data))){ return "<class 'str'>" }
        if(!isNaN(Number(data))){ return "<class 'int'>" }
    }

    FunctionCaller(index,params){
        if(index===0){ this.print(params) }
        if(index===1){ this.capitalize(params) }
        if(index===2){ this.casefold(params) }
        if(index===3){ this.type(params) } 
    }

}

class Divine extends BuiltInFunctions_DivineLang{

    constructor(code){
        super();
        let temp_code = code.split(/;\n\s/g)

        for(let i = 0 ; i < temp_code.length ; i++){

            if(!this.isValid(temp_code[i])){
                throw `Parenthesis don't match at line ${i} you might have forgoten a closing or opening bracket !!`
            }

        }

        this.code = code.split(" ").join("")
        this.LETTERS = /[a-z]/gi
        this.NUMBERS = /[0-9]/gi
        this.SPECHARS = /[-’/`~!#*$@_%+=.,^&(){}[\]|;:”<>?\\]/g
        this.keywords = ["for","while","in","if","else","def","is","and","or","elif","break","continue","return","True","False","None"]
        this.Variables = new Map()
        this.IdentificationDeclarations(0)
    }

    isValid(s){
        var st = []
        for(var l of s)
            if ((l="({[]})".indexOf(l))>-1)
                if (st[st.length-1]+l===5)
                    st.length--;
                else
                    st.push(l);
        return st.length===0
    };

    CheckIfString(str){
        // console.log(str[str.length-1])
        let l = str.length-1
        if( (str[0] === `"` || str[0] === `'`) && (str[l] === `"` || str[l] === `'`) ){
            return true
        }
        else return false 
    }

    IdentificationDeclarations(index){
        let c = this.code
        for(let pointer = index ; pointer < c.length ; pointer++ ){

            if(/\s\n/g.test(c[pointer])){  continue;  } // skip spaces and new lines

            if(/#/g.test(c[pointer])){ // its a comment
                while(c.length){
                    if(c[pointer] === "\n"){ break }
                    pointer++
                }
            }
 
            if(c[pointer] === "["){ // assignment of variables

                if( c[pointer+1] === "]" ){ break } // in case of empty declaration [] like this we must break else loop

                pointer++ ; let varName= "" ; let varValue = "" ; let i = 0

                while(true){ // for variable name
                    if(c[pointer] === "="){ break }
                    varName += c[pointer]
                    pointer++ 
                }

                if(this.keywords.includes(varName)){ // variable name cannot be same as name of keywords .
                    throw `Syntax Error : invalid syntax "${varName}" is a reserved keyword it cannot be used !!`
                }

                pointer++ // move ahead

                if( c[pointer]+c[pointer+1] === "[[" ){ // array is declared
                    let varValue = [] ; pointer = pointer + 2 ; let i = 0
                    while(true){
                        if( c[pointer]+c[pointer+1] === "]]" ){ pointer++;break }
                        if( c[pointer] === "," ){ pointer++ } // we don't need to add commas also the array in variable map hence we skip it.
                        varValue[i] = c[pointer] 
                        pointer++ ; i++
                    }
    
                    this.Variables.set(varName,varValue)
                }

                else if( c[pointer]+c[pointer+1] === "{{" ){  // dictionary / object is declared
                    pointer++ ; let varValue = ""
                    while(true){
                        varValue += c[pointer]
                        if( c[pointer] === "}" ){ break }
                        pointer++
                    }
                    varValue = `${varValue}`
                    this.Variables.set(varName,JSON.parse(varValue))
                }

                else{ // integer or string is declared 
                    while(true){
                        if(c[pointer] === "]"){ break }
                        varValue += c[pointer]
                        pointer++
                    }
                    varValue = this.ProcessData(varValue)
                    this.Variables.set(varName,varValue)
                }

            }

            if( c[pointer]+c[pointer+1]+c[pointer+2] === "for" ){  this.HandleForLoop(pointer+3) ; break ; }

            if(c[pointer] === "{"){ this.HandleBuiltInFunctions(pointer+1) ; break ; }

        }
        console.log(this.Variables)
    }

    HandleForLoop(start){
        let c = this.code
        for(let i = start ; i < c.length ; i++ ){
            if( c[i]+c[i+1] === "in" ){
                // pending lol
            }
        }
    }

    ProcessData(varValue){

        if( this.Variables.has(varValue) ){  varValue = this.Variables.get(varValue)  } // if variable is assigned another variable

        else if(varValue.includes("+")){ varValue = this.HandleAddition(varValue) } // for 2+2 or "hello"+"world" such cases

        else if(varValue.includes("-")){ varValue = this.HandleSubtraction(varValue) } // for 4-2 such cases

        else if(varValue.includes("*")){ varValue = this.HandleMultiplication(varValue) } // for 2*2 such cases

        else if(varValue.includes("/")){ varValue = this.HandleDivision(varValue) }  // for 2/2 such cases

        else if(varValue.includes("%")){ varValue = this.HandleMod(varValue) }  // for 2%2 such cases

        else if( !this.CheckIfString(varValue) && isNaN(Number(varValue)) ){ throw `NameError : name "${varValue}" is not defined .`  }

        return varValue
    }

    ArithmaticOperationsController(data){

        if(this.Variables.has(data)){  data = this.Variables.get(data) }
    
        else if(data.includes("+")){ data = this.HandleAddition(data) }
    
        else if(data.includes("-")){  data = this.HandleSubtraction(data)  }
        
        else if(data.includes("/")){  data = this.HandleDivision(data)  }
    
        else if(data.includes("*")){  data = this.HandleMultiplication(data)  }
    
        else if(data.includes("%")){  data = this.HandleMod(data)  }

        else if( !this.CheckIfString(data) && isNaN(Number(data)) ){ throw `NameError : name "${data}" is not defined .`  }
    
        return data
    }
    
    HandleAddition(data){
        data = data.split("+")  // console.log("add",data)

        let int_sum = 0 ; let str_sum = "" ;

        for(let i = 0 ; i < data.length ; i++ ){

            if( this.CheckIfString(data[i]) ){ // for adding strings 
                str_sum += data[i].replace(/"/g,"").replace(/'/g,"")
            }

            if( !this.CheckIfString(data[i]) && isNaN(Number(data[i])) ){ // not a program string and not a number also then it must be a variable
                data[i] = this.ArithmaticOperationsController(data[i])  // for multiple operations
            }

            if(!this.CheckIfString(data[i])){  int_sum += Number(data[i]) }

        }

        if(int_sum===0){ return str_sum } // two strings were passed . BUG FOUND <---
        if(str_sum===""){ return int_sum+"" } // two integers were passed
        else{  throw `TypeError: can only concatenate str (not "int") to str`  } // one string and one integer were passed which cannot be added in python.

    }

    HandleSubtraction(data){
        data = data.split("-")  // console.log("sub => ",data)
    
        if( this.CheckIfString(data[0]) ){ // if it is a program string (quotes prresent) then it can't be subtracted .
            throw `TypeError: unsupported operand type(s) for -: '${this.type(data[0])}' and '${this.type(data[1])}' ` 
        }

        data[0] = this.ArithmaticOperationsController(data[0])  // for data purification 
        let ans = data[0] 

        for(let i = 1 ; i < data.length ; i++){

            if( this.CheckIfString(data[i]) ){  // strings can't be subtracted
                throw `TypeError: unsupported operand type(s) for -: '${this.type(data[i])}' and '${this.type(data[i+1])}' ` 
            }

            data[i] = this.ArithmaticOperationsController(data[i])  // for multiple operations
            ans -= Number(data[i]) 
            
        }

        return ans+""

    }

    HandleMultiplication(data){
        data = data.split("*")
        let ans = 1
        for(let i = 0 ; i < data.length ; i++){
    
            if( this.CheckIfString(data[i]) ){  // strings can't be subtracted
                throw `TypeError: can't multiply sequence by non-int of type '${this.type(data[i])}'` 
            }

            data[i] = this.ArithmaticOperationsController(data[i])  // for multiple operations
            ans = ans * data[i]
        }
        return ans
    }

    HandleDivision(data){
        data = data.split("/")
        console.log(data)
        
        if( this.CheckIfString(data[0]) || this.CheckIfString(data[1]) ){  // strings can't be divided
            throw `TypeError: can't divide sequence by non-int of type '${this.type(data[0])}'` 
        }

        data[0] = this.ArithmaticOperationsController(data[0])
        data[1] = this.ArithmaticOperationsController(data[1])
        console.log(data[0]/data[1])
        return data[0]/data[1]

    }

    HandleMod(data){
        data = data.split("%")
        console.log(data)
        
        if( this.CheckIfString(data[0]) || this.CheckIfString(data[1]) ){  // strings can't be divided
            throw `TypeError: can't divide sequence by non-int of type '${this.type(data[0])}'` 
        }

        data[0] = this.ArithmaticOperationsController(data[0])
        data[1] = this.ArithmaticOperationsController(data[1])
        console.log(data[0]%data[1])
        return data[0]%data[1]

    }

    HandleBuiltInFunctions(pointer){
        let c = this.code ; let fnName = "" ; let params = ""
        while(true){
            if(c[pointer] === "("){ break }
            fnName += c[pointer]
            pointer++
        }

        pointer++;

        while(true){
            if(c[pointer] === ")"){ break }
            params += c[pointer]
            pointer++
        }

        pointer+=2

        if( !this.builtInFunctions.includes(fnName) ){  throw `Name ${fnName} is not defined !` }

        else{
            let fn_arr = this.builtInFunctions
            params = this.ProcessData(params)
            for(let i = 0; i < fn_arr.length ; i++){
                if(fn_arr[i] === fnName){ this.FunctionCaller(i,params) }
            }
        }

        while( /\s/.test(c[pointer]) ){ pointer++ }

        if(c[pointer] === "{"){ this.HandleBuiltInFunctions(pointer+1) } // if another function is again encountered

        if(c[pointer] === "["){ this.HandleVaribleDeclarations(pointer) } // if variable is declared again

    }

    DetectFunctions(start){
        let c = this.code
        console.log(c.length,start)
        for(let pointer = start ; pointer < 42 ; pointer++){

            if(c[pointer+1]+c[pointer+2]+c[pointer+3] === "def"){ // user defined functions
                console.log(pointer)
                pointer += 4
                let functionName = ""
                while(true){
                    if(c[pointer] === "("){break}
                    functionName += c[pointer]
                    pointer++
                }
                while(true){
                    if(c[pointer] === "}"){break}
                    pointer++
                }
                this.FunctionsDefined.push(functionName)
            }

            if(c[pointer+1]+c[pointer+2]+c[pointer+3] !== "def"){
                // console.log(c[pointer],pointer)
                let functionName = ""
                while(true){
                    if(c[pointer] !== "("){
                        functionName += c[pointer]
                    }
                    if(c[pointer] === "}"){break}
                    pointer++
                }
                this.FunctionsDefined.push(functionName)
            }

        }
    }

}

let Radha = new Divine(`

    [i = 1]
    [arr = [[1,2,3,4,5,6,7,8]] ]
    for i in arr:
  
`)
