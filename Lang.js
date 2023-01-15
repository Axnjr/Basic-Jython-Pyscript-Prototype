class BuiltInFunctions_DivineLang{
    constructor(){
        this.builtInFunctions = 
                                [
                                    "print",
                                    "capitalize",
                                    "casefold",
                                    "type",
                                ]

        this.userDefinedFunctions = [] // empty array to store user defined functions .
        
    }

    print(data){ 
        if(typeof(data)==="string"){ console.log(data.replace(/'/g,"").replace(/"/g,"")) }
        else{ console.log(data) }
    }

    capitalize(data){ return data.toUpperCase() }

    casefold(data){ return data.toLowerCase() }

    type(data){ 
        if(isNaN(Number(data))){ return "<class 'str'>" }
        if(!isNaN(Number(data))){ return "<class 'int'>" }
    }

    FunctionCaller(index,params){
        if(index===0){ this.print(params) }
        if(index===1){ return this.capitalize(params) }
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
        this.CODE = code.split(" ").join("")
        this.LETTERS = /[a-z]/gi
        this.NUMBERS = /[0-9]/gi
        this.KEYWORDS = ["for","while","in","if","else","def","is","and","or","elif","break","continue","return","True","False","None","pass"]
        this.VARIABLES = new Map() // hash map to store variables defined inthe program .
        this.FUNCTIONS = new Map() // hash map to store user defined functions .
        this.IF_IDS = new Map() // hash map for implemeting if and else statement unique/wierd way lol .
        this.MainProgramThread(0,this.CODE)
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
        let l = str.length-1
        if( (str[0] === `"` || str[0] === `'`) && (str[l] === `"` || str[l] === `'`) ){ return true }
        else return false 
    }

    MainProgramThread(index,script){
        let c = script || this.CODE
        for(let pointer = index ; pointer < c.length ; pointer++ ){
            if(/\s/g.test(c[pointer])){ pointer++ } // skipping white spaces
            if(/#/g.test(c[pointer])){ // its a comment
                while(c.length){ if(c[pointer] === "\n"){ break } ; pointer++ }
            }

            if(c[pointer] === "["){ // assignment of variables
                if( c[pointer+1] === "]" ){ break } // in case of empty declaration [] like this we must break else loop
                pointer++ ; let varName= "" ; let varValue = "" ; let i = 0

                while(true){ // for variable name
                    if(c[pointer] === "="){ break }
                    varName += c[pointer]
                    pointer++ 
                }

                if(this.KEYWORDS.includes(varName)){ // variable name cannot be same as name of keywords .
                    throw `Syntax Error : invalid syntax "${varName}" is a reserved keyword it cannot be used !!`
                }
                pointer++ // move ahead

                if( c[pointer]+c[pointer+1] === "[[" ){ // array is declared
                    pointer = pointer + 1
                    varValue =  this.ArrayDeclaration(pointer,c)
                    console.log("okokokok ======",varValue)
                    // varValue = this.ArrayDeclaration(pointer,c)
                    varValue = 0
                    this.VARIABLES.set(varName,varValue)
                }

                else if( c[pointer]+c[pointer+1] === "{{" ){  // dictionary / object is declared .
                    pointer = pointer + 1 ; let varValue = ""
                    while(true){
                        varValue += c[pointer]
                        if( c[pointer] === "}" ){ break }
                        pointer++
                    }
                    varValue = `${varValue}`
                    this.VARIABLES.set(varName,JSON.parse(varValue))
                }

                else{ // integer or string is declared 
                    while(true){
                        if(c[pointer] === "]"){ break }
                        varValue += c[pointer]
                        pointer++
                    }

                    if( this.VARIABLES.has(varValue[0]) &&  varValue[1] === "[" ){
                        varValue = this.ReturnPropertyOfObject(varValue)
                    }

                    if( varValue.includes("((") && varValue.includes("))") ){ 
                        // for conditional expresions's work pending incomplte .....
                        // this.ConditionalInterpreter(varValue,pointer+2) ; break
                    }

                    if( this.builtInFunctions.includes(varValue.split("(")[0])  ){ 
                        // in case variable is assigned value returned from a function .
                        // Execute function will then call Function Caller which will again call
                        // the respective function that return the executed value to the 
                        // Function Caller which then returns to Execute function and then it returns here .
                        varValue = this.ExecuteFunction(varValue.split("(")[0],varValue.split("(")[1]) 
                    }
                    else{  varValue = this.ProcessData(varValue) }
                    this.VARIABLES.set(varName,varValue)
                }
            }

            if(c[pointer] === "{"){ this.HandleDefinedFunctions(pointer+1,c) ; break ; }

            if( c[pointer]+c[pointer+1]+c[pointer+2] === "for" ){  this.ForLoopInterpreter(pointer+3,c) ; break ; }

            let k = c[pointer]+c[pointer+1]+c[pointer+2]+c[pointer+3]
            if( k === "else" ){ 
                this.ElseInterpreter(pointer+4);
                break;
            }

            if( c[pointer]+c[pointer+1] === "if" ){ this.IfInterpreter(pointer+2,c) ; break ; }

            if( c[pointer]+c[pointer+1]+c[pointer+2] === "def" ){ this.RegisterUserDefinedFunctions(pointer+3) ; break }
                   
        }
    }

    ArrayDeclaration(pointer,c){ // working fine tested OK .
        let varValue = [] ; pointer++
        while(c[pointer]+c[pointer+1] !== "]]"){
            varValue += c[pointer]
            if(pointer>this.CODE.length){ break }
            pointer++
        }
        varValue = `[${varValue}]`
        return JSON.parse(varValue)
    }

    ReturnElementAtIndexOfArray(varValue){ // working fine tested OK .
        varValue = varValue.split("[")
        if(this.VARIABLES.has(varValue[0])){
            let temp = this.VARIABLES.get(varValue[0]) // array whose element is required
            let index = varValue[1].replace("]","") // index of element to be searched
            if( !typeof(temp) === "object" ){  throw `TypeError: "${this.type(temp)}" object is not subscriptable .` } // given variable is not an array
            if( index >= temp.length ){ throw `IndexError: list index out of range` } // index is greater than array length .
            return temp[index]
        }
        else if( !this.VARIABLES.has(varValue[0]) ){ throw `NameError : name "${varValue[0]}" is not defined .` }
    }

    ReturnPropertyOfObject(data){
        data = data.split("[")
        let obj = this.VARIABLES.get(data[0])
        if(obj.hasOwnProperty(data[1])){ return obj[data[1]]+"" }
        else{ throw `Name Error : "${data[1]}" not found in ${obj} .` }
    }

    ProcessData(varValue){ // working fine tested OK .
        if( this.VARIABLES.has(varValue) ){  varValue = this.VARIABLES.get(varValue)  } // if variable is assigned another variable

        else if(varValue.includes("+")){ varValue = this.HandleAddition(varValue) } // for 2+2 or "hello"+"world" such cases

        else if(varValue.includes("-")){ varValue = this.HandleSubtraction(varValue) } // for 4-2 such cases

        else if(varValue.includes("*")){ varValue = this.HandleMultiplication(varValue) } // for 2*2 such cases

        else if(varValue.includes("/")){ varValue = this.HandleDivision(varValue) }  // for 2/2 such cases

        else if(varValue.includes("%")){ varValue = this.HandleMod(varValue) }  // for 2%2 such cases

        else if(varValue.includes("[")){ varValue = this.ReturnElementAtIndexOfArray(varValue) }

        else if( !this.CheckIfString(varValue) && isNaN(Number(varValue)) ){ throw `NameError : name "${varValue}" is not defined .`  }

        return varValue
    }
    
    HandleAddition(data){ // working fine tested OK .
        data = data.split("+")  // console.log("add",data)

        let int_sum = 0 ; let str_sum = "" ;

        for(let i = 0 ; i < data.length ; i++ ){

            if( this.CheckIfString(data[i]) ){ // for adding strings 
                str_sum += data[i].replace(/"/g,"").replace(/'/g,"")
            }

            if( !this.CheckIfString(data[i]) && isNaN(Number(data[i])) ){ // not a program string and not a number also then it must be a variable
                data[i] = this.ProcessData(data[i])  // for multiple operations
            }

            if(!this.CheckIfString(data[i])){  int_sum += Number(data[i]) }

        }
        if(int_sum===0){ return str_sum } // two strings were passed . BUG FOUND <---
        if(str_sum===""){ return int_sum+"" } // two integers were passed
        else{  throw `TypeError: can only concatenate str (not "int") to str`  } // one string and one integer were passed which cannot be added in python.
    }

    HandleSubtraction(data){ // working fine tested OK .
        data = data.split("-")  // console.log("sub => ",data)

        if( this.CheckIfString(data[0]) ){ // if it is a program string (quotes prresent) then it can't be subtracted .
            throw `TypeError: unsupported operand type(s) for -: '${this.type(data[0])}' and '${this.type(data[1])}' ` 
        }

        data[0] = this.ProcessData(data[0])  // for data purification .
        let ans = data[0] 

        for(let i = 1 ; i < data.length ; i++){
            if( this.CheckIfString(data[i]) ){  // strings can't be subtracted .
                throw `TypeError: unsupported operand type(s) for -: '${this.type(data[i])}' and '${this.type(data[i+1])}' ` 
            }
            data[i] = this.ProcessData(data[i])  // for multiple operations
            ans -= Number(data[i]) 
        }
        return ans+""
    }

    HandleMultiplication(data){ // working fine tested OK .
        data = data.split("*")
        let ans = 1
        for(let i = 0 ; i < data.length ; i++){
    
            if( this.CheckIfString(data[i]) ){  // strings can't be subtracted
                throw `TypeError: can't multiply sequence by non-int of type '${this.type(data[i])}'` 
            }

            data[i] = this.ProcessData(data[i])  // for multiple operations
            ans = ans * data[i]
        }
        return ans
    }

    HandleDivision(data){ // working fine tested OK .
        data = data.split("/")
        if( this.CheckIfString(data[0]) || this.CheckIfString(data[1]) ){  // strings can't be divided
            throw `TypeError: can't divide sequence by non-int of type '${this.type(data[0])}'` 
        }
        data[0] = this.ProcessData(data[0])
        data[1] = this.ProcessData(data[1])
        return data[0]/data[1]

    }

    HandleMod(data){ // working fine tested OK .
        data = data.split("%")
        if( this.CheckIfString(data[0]) || this.CheckIfString(data[1]) ){  // strings can't be divided
            throw `TypeError: can't divide sequence by non-int of type '${this.type(data[0])}'` 
        }
        data[0] = this.ProcessData(data[0])
        data[1] = this.ProcessData(data[1])
        return data[0]%data[1]

    }

    RegisterUserDefinedFunctions(pointer){
        let c = this.CODE ; let fnName = "" ; let params = "" ; let fn_code = ""

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
        pointer++

        while( c[pointer] != ";" ){ 
            if(pointer>c.length){  throw `Syntax Error : Function never ended ";" not found .` ; } 
            fn_code += c[pointer]
            pointer++ ; 
        }
        let FN_OBJECT = {}
        FN_OBJECT.PARAMETERS = params.split(",")
        FN_OBJECT.CODE = fn_code + ":" // adding a semi colon bcuz else it would give error in case of user defined function .
        this.userDefinedFunctions.push(fnName)
        this.FUNCTIONS.set(fnName,FN_OBJECT)

        console.log(this.FUNCTIONS,this.userDefinedFunctions)

        this.MainProgramThread(pointer+1,c)

    }

    LoopTillGivenCharacter(pointer,till,optional_script,optional_error_message){ // "till" is the character till which we have to loop .
        let return_value = "" ;
        if(optional_script===undefined){ optional_script = this.CODE }
        while(true){
            if( optional_script[pointer] === till ){ break }

            if( pointer > optional_script.length ){
                if(optional_error_message === undefined){ break } // optional error message for more symantic erorrs .
                else{ throw optional_error_message }
            }

            return_value += optional_script[pointer]
            pointer++
        }
        return [pointer,return_value]
    }

    HandleDefinedFunctions(pointer,script){
        let c = script ; let fnName = "" ; let PARAM_VALUES = ""

        while(true){
            if(c[pointer] === "("){ break }
            fnName += c[pointer]
            pointer++
        }
        pointer++;

        while(true){
            if(c[pointer] === ")"){ break }
            PARAM_VALUES += c[pointer]
            pointer++
        }

        pointer++

        if( this.builtInFunctions.includes(fnName) ){ this.ExecuteFunction(fnName,PARAM_VALUES) }

        if( !this.builtInFunctions.includes(fnName) && !this.userDefinedFunctions.includes(fnName) ){ 
            throw `Name ${fnName} is not defined !`
        }
        
        if( this.userDefinedFunctions.includes(fnName) ){ 
            let script = this.FUNCTIONS.get(fnName).CODE // execute the function script stored in the FUNCTION hash map.
            let PARAMS = this.FUNCTIONS.get(fnName).PARAMETERS ; PARAM_VALUES = PARAM_VALUES.split(",")

            if(PARAM_VALUES.length !== PARAMS.length){ // uneven argument number (arguments = params)
                throw `"${fnName}" takes ${PARAMS.length} arguments got ${PARAM_VALUES.length}`
            }

            for(let i in PARAMS){  this.VARIABLES.set(PARAMS[i],PARAM_VALUES[i])  }
            this.MainProgramThread(0,script)
        }

        this.MainProgramThread(pointer,c)
    }

    ExecuteFunction(fnName,params){ // working fine tested OK .
        params = params.replace(")","")
        let fn_arr = this.builtInFunctions
        params = this.ProcessData(params)
        for(let i = 0; i < fn_arr.length ; i++){
            if(fn_arr[i] === fnName){ var ans = this.FunctionCaller(i,params) || null }
        }
        return ans
    }

    ForLoopInterpreter(pointer,script){ 
        let c = script ;  let loop = ""  ;  let loop_script = ""  ; 

        while( c[pointer] != "\n" ){  loop += c[pointer] ; loop += "" ; pointer++ }   
        loop = loop.split("in")

        if(loop.length <= 1){ throw `Syntax Error : "in" not found .` }

        let temp = this.LoopTillGivenCharacter(pointer,":",c,'Syntax Error : Loop end ":" not found .')
        loop_script = temp[1] ; pointer = temp[0]

        if( loop[1].includes("[") && this.LETTERS.test(loop[1]) ){ // variable having an array 
            let temp = loop[1].replace(/[[|]|]/g,"")
            let start = loop[0].replace(/[[|]|]/g,"")
            if( !this.VARIABLES.has(temp) ){ throw `NameError : name "${temp}" is not defined .` }
            this.VARIABLES.set(start,0)
            this.ExecuteDirectForLoop(start,this.VARIABLES.get(temp),loop_script)
        }

        if( loop[1].includes("[[") ){   // array directly given 
            let start = loop[0].replace(/[[|]|]/g,"")
            this.VARIABLES.set(start,0)
            var loopArray = this.ArrayDeclaration(loop[1][2],loop[1]) ;
            this.ExecuteDirectForLoop(start,loopArray,loop_script)
        }

        if( loop[1].includes("(") ){ // Range tuple given 
            loop[1] = loop[1].replace(/[()]/g,"").split(",")
            let start = loop[0].replace(/[[|]|]/g,"")
            this.VARIABLES.set(start,loop[1][0])
            this.ExecuteRangeForLoop(loop[1][0],loop[1][1],loop[1][2],start,loop_script)
        }

        this.MainProgramThread(pointer,c)        
    }

    ExecuteDirectForLoop(start,arr,loop_script){
        for(let i of arr){ this.VARIABLES.set(start,i) ; this.MainProgramThread(0,loop_script) }
    }

    ExecuteRangeForLoop(start,end,inc,varValue,loop_script){
        if( end === undefined ){ end = start ; start = 0 } // (10) in such range start must be 0 and end will be 10 therfore ..
        if(inc === undefined){ inc = 1 } // incrementing factor is also optional parameter .
        for(let i = Number(start) ; i < Number(end) ; i = i + Number(inc) ){
            this.VARIABLES.set(varValue,i+1) ; this.MainProgramThread(0,loop_script)
        }
    }

    IfInterpreter(pointer,script){
        let c = script ; let CONDITION ; let ans ; let temp ;
        temp = this.LoopTillGivenCharacter(pointer,"\n") // temprary variable
        CONDITION = temp[1]
        pointer = temp[0]
        ans = eval(CONDITION) // I could have used eval for arithematic also but I was enjoying coding that part by myself, till this point I got little bored :)
        temp = this.LoopTillGivenCharacter(pointer,";") // temprary variable
        if(ans){ this.MainProgramThread(0,temp[1]) } // temp[1] is the if script to be executed 
        this.MainProgramThread(temp[0],c) // temp[0] is the modified pointer returned by the LoopTillGivenCharacter function
    }

    // ElseInterpreter(pointer){ // c = script 
    //     let c = this.CODE ; var else_id = "" ; let else_script = "" ;
    //     if( !c[pointer]+c[pointer+1] === "=>" ){
    //         throw `Syntax Error : Missing "if" id/name for executing else statement . `
    //     }
    //     pointer+=2

    //     while( c[pointer] != ":" ){
    //         if( c[pointer] === "\n" ){ break }
    //         else_id += c[pointer] ;
    //         pointer++ 
    //     }

    //     while( true ){ 
    //         if(pointer>c.length){  throw `Syntax Error : If statement never ended ";" not found .` ; } 
    //         else_script += c[pointer]
    //         if( c[pointer] === ";" ){ break }
    //         pointer++ 
    //     }

    //     if(this.IF_IDS.has(else_id)){ 
    //         if(!this.IF_IDS.get(else_id)){
    //             this.MainProgramThread(0,else_script)
    //         }
    //     }
    //     this.MainProgramThread(pointer,c) // back to code where we left .
    // }
    
}
//-------------------------------------------------------------------------------------------------------------//

// for ends with ':' and starts with new line .

//-------------------------------------------------------------------------------------------------------------//

// REMAINING NOT DONE PROFESSIONALLY , FIX "IF" , "ELS IF" ,"ELSE" .
// "IF" statement has to be given a "ID" in order to implememt "ELSE" statement after it . 
// this "ID" must end with a ":" or a new line "\n"
// Only one advantage you can use else statement anywhere in the code not compulsoryly just ahead of if statment .
// if and else statement both must end with ";"

//-------------------------------------------------------------------------------------------------------------//

// 

//-------------------------------------------------------------------------------------------------------------//

let Radha = new Divine(`

    [x = 67]
    [arr = [[1,2,3,4,5,6,7,8]] ]

    def Check(o,m,n,s)
        {print(o+m)}
        
    ;

    if 2342 > 2
        for [i] in (25)
            {Check(1,2,3,4)}
        :
    ;

    
`)
// print(x,y) => problem 
// #[arr = [[1,2,3,4,5,6,7,8]] ]
// #[y = {{"name":"John", "age":30, "city":"New York"}} ] # BUG 
// #{print(y)}
// #for [i] in [arr] :-> Indirect
// #    {print(i)}

//#[x = [[k,r,i,s,h,n,a]] ] # Don't add quotes it's already a string .

//   for [i] in (6)
//   {print(y)} 
//   {print(x)} 
// :

// :
// if "a" in [y]
//         {print("test")}
//     :
//     if "2" in [y]
//         {print("test1")}
//     :
//     else
//         {print("test2")}
//     :
//     [z = 23]
//     {print(z)}

// def Check()
//         if 4 < 2
//             for [i] in (1,5)
//                 {print("yes")}:
//         :
//     :

//     {Check()}


//     def Check() # Functions end with a semi colon 
//         if 2 == 1
//             {print("yes")}
//         :
//         else
//             {print("no")}
//         :
//     ;

//     {Check()}


// for [i] in (3)

//     {print(i)}

//     for [o] in (3)
//         {print("break")}
//     :

//     [x = 0909090909]
//     {print(x)}
//     {print(x)}
//     {print(x)}
//     {print(x)}

//     for [p] in (2)
//         {print("this")}
//     :
// :

// if 1 > 10 => fit:
//         {print("YES")}
//         if 3 > 4 => sec:
//             {print("yes_3>4")}
//         ;
//         else => sec:
//             {print("no_3<4")}
//         ;
//     ;

//     {print("HGHGHGHG")}

//     else => fit:
//         {print("NO")}
//         if 2 > 11 => yes:
//             {print("2>1")}
//         ;
//         else => yes:
//             {print("2<1")}
//         ;
//     ;

//     {print("WORKING")}

// [Y = {{"num":23,"age":19,"month":12}} ]
//     [ u = 90 ]

//     [ x = Y[num] ] # Property of object can also be accesed same python way .