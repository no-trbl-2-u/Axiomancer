/**
 * INQUIRER.JS COMPREHENSIVE EXAMPLE
 *
 * This file demonstrates the core features of the inquirer.js library
 * for creating interactive command-line prompts.
 *
 * QUICK START:
 * Run this example: `node pizza.mjs` or `tsx inquierer.example.ts`
 *
 * QUESTION TYPES DEMONSTRATED:
 * 1. confirm  - Yes/No questions (returns boolean)
 * 2. input    - Free text input (returns string, can be filtered to other types)
 * 3. list     - Selection from list using arrow keys (returns selected value)
 * 4. rawlist  - Numbered selection (user types number) (returns selected value)
 * 5. expand   - Compact menu with keyboard shortcuts (returns value from choice)
 *
 * OTHER AVAILABLE TYPES (not shown):
 * - checkbox  - Multiple selection with arrow keys and spacebar
 * - password  - Hidden text input (like typing passwords)
 * - editor    - Opens text editor for longer input
 *
 * KEY CONCEPTS:
 * - validate: Function to check if input is acceptable (return true or error message)
 * - filter: Transform the answer before storing (e.g., string to number, lowercase)
 * - transformer: Change how answer displays in terminal (doesn't affect stored value)
 * - when: Conditionally show/hide questions based on previous answers
 * - default: Pre-filled value if user just presses Enter
 * - choices: Array of options for list-based questions
 *
 * EXECUTION FLOW:
 * 1. Call inquirer.prompt() with array of question objects
 * 2. Questions are asked sequentially in array order
 * 3. Each answer is validated (if validate function provided)
 * 4. Each answer is transformed (if filter function provided)
 * 5. Returns Promise with answers object containing all responses
 */

import inquirer from 'inquirer';

async function main() {

    /* Text to prompt the user */
    console.log('Initial message to prompt the user');

    /**
     * inquirer.prompt() - Main API for creating interactive CLI prompts
     *
     * Generic Type Parameter <{...}>: Defines the shape of the answers object
     * - Each property corresponds to a question's 'name' field
     * - Property types should match what the question returns
     * - Optional properties (like 'prize') use the '?' modifier
     *
     * Parameter: Array of question objects
     * Returns: Promise<T> where T is the generic type with all answers
     */
    const answers = await inquirer.prompt<{
        /* Types that will be returned by the inquirer prompt */
        toBeDelivered: boolean;  // From 'confirm' type - returns boolean
        phone: string;           // From 'input' type - returns string
        size: string;            // From 'list' type - filtered to lowercase string
        quantity: number;        // From 'input' type - filtered to number via Number()
        toppings: string;        // From 'expand' type - returns the 'value' field
        beverage: string;        // From 'rawlist' type - returns string
        comments: string;        // From 'input' type - returns string
        prize?: string;          // Optional - only present when 'when()' returns true
    }>([
        /**
         * Questions Array - Each object defines one prompt
         *
         * Common properties available for all question types:
         * - type: Question type (confirm, input, list, rawlist, expand, checkbox, password, editor)
         * - name: Key where answer is stored in results object
         * - message: Question text shown to user
         * - default: (optional) Default value if user provides no input
         * - when: (optional) Function returning boolean - controls if question is asked
         * - validate: (optional) Function to validate input - return true or error message
         * - filter: (optional) Transform answer before storing (e.g., toLowerCase, Number)
         * - transformer: (optional) Transform display only - doesn't affect stored value
         */
        {
            /**
             * Question Type: 'confirm'
             * - Displays a yes/no prompt
             * - Returns: boolean (true/false)
             * - User can press 'y' or 'n', or use arrow keys to select
             */
            type: 'confirm',
            name: 'toBeDelivered',
            message: 'Is this for delivery?',
            default: false,  // Default to 'No' if user just presses Enter
            /**
             * transformer: Changes how the answer appears in the terminal (display only)
             * - Takes the boolean answer
             * - Returns a string to display (👍 for true, 👎 for false)
             * - Does NOT change the actual value stored in answers.toBeDelivered
             */
            transformer: (answer: boolean) => (answer ? '👍' : '👎'),
        },
        {
            /**
             * Question Type: 'input'
             * - Free-text input from the user
             * - Returns: string (by default, but can be transformed with filter)
             * - User types their answer and presses Enter
             */
            type: 'input',
            name: 'phone',
            message: "What's your phone number?",
            /**
             * validate: Function to check if user input is acceptable
             * - Receives the user's input as a parameter
             * - Return true if valid
             * - Return a string error message if invalid (shown to user, they can retry)
             * - Runs BEFORE filter (validates raw input)
             */
            validate(value: string) {
                const pass = value.match(
                    /^([01])?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?)(?:\d+)?)?$/i,
                );
                if (pass) {
                    return true;  // Valid phone number format
                }

                return 'Please enter a valid phone number';  // Error message shown to user
            },
        },
        {
            /**
             * Question Type: 'list'
             * - Displays a list of options with a pointer/cursor
             * - User navigates with arrow keys and presses Enter to select
             * - Returns: The selected choice (string by default, or transformed by filter)
             * - Only one option can be selected
             */
            type: 'list',
            name: 'size',
            message: 'What size do you need?',
            choices: ['Large', 'Medium', 'Small'],  // Array of options to choose from
            /**
             * filter: Transforms the answer BEFORE storing it
             * - Receives the selected choice
             * - Returns the transformed value that will be stored
             * - Runs AFTER validation (if present)
             * - In this case: 'Large' becomes 'large', 'Medium' becomes 'medium', etc.
             */
            filter(val: string) {
                return val.toLowerCase();
            },
        },
        {
            /**
             * Question Type: 'input' (with number conversion)
             * - Demonstrates combining validate and filter
             * - validate ensures input is a valid number
             * - filter converts the string to an actual number type
             */
            type: 'input',
            name: 'quantity',
            message: 'How many do you need?',
            /**
             * validate: Check if input can be parsed as a number
             * - Uses shorthand: returns the boolean result OR the error message
             * - If valid is true, returns true
             * - If valid is false, returns the error string
             */
            validate(value: string) {
                const valid = !Number.isNaN(Number.parseFloat(value));
                return valid || 'Please enter a number';
            },
            /**
             * filter: Can be a function OR a constructor
             * - Here we use the Number constructor directly
             * - Converts the validated string '5' to the number 5
             * - This is why the type definition shows quantity: number
             */
            filter: Number,
        },
        {
            /**
             * Question Type: 'expand'
             * - Compact menu with single-key shortcuts
             * - User presses a key letter to select (e.g., 'p', 'a', 'w')
             * - User can also press 'h' to expand and see full list
             * - More compact than 'list' for many options
             * - Returns: The 'value' field of the selected choice
             */
            type: 'expand',
            name: 'toppings',
            message: 'What about the toppings?',
            /**
             * choices: Array of choice objects (not just strings like 'list')
             * Each choice has:
             * - key: Single character shortcut (must be unique)
             * - name: Description shown to user
             * - value: What gets stored in the answer (not the name!)
             *
             * Note: The returned value is from the 'value' field, not 'name'
             */
            choices: [
                {
                    key: 'p',
                    name: 'Pepperoni and cheese',
                    value: 'PepperoniCheese',  // This is what gets stored
                },
                {
                    key: 'a',
                    name: 'All dressed',
                    value: 'alldressed',
                },
                {
                    key: 'w',
                    name: 'Hawaiian',
                    value: 'hawaiian',
                },
            ],
        },
        {
            /**
             * Question Type: 'rawlist'
             * - Numbered list where user types the number to select
             * - Similar to 'list' but uses number input instead of arrow keys
             * - User types '1', '2', or '3' and presses Enter
             * - Returns: The selected choice string
             * - Useful for when arrow keys might not work well
             */
            type: 'rawlist',
            name: 'beverage',
            message: 'You also get a free 2L beverage',
            choices: ['Pepsi', '7up', 'Coke'],  // Simple string array (no objects needed)
        },
        {
            /**
             * Question Type: 'input' (with default value)
             * - Demonstrates using a default value
             * - If user just presses Enter without typing, default is used
             * - Default value is shown in parentheses in the prompt
             */
            type: 'input',
            name: 'comments',
            message: 'Any comments on your purchase experience?',
            default: 'Nope, all good!',  // Pre-filled answer if user presses Enter
        },
        {
            /**
             * Question Type: 'list' (with conditional display)
             * - Demonstrates the 'when' property for conditional questions
             * - This question is only asked if the 'when' function returns true
             * - Since it's conditional, the type is optional (prize?: string)
             */
            type: 'list',
            name: 'prize',
            message: 'For leaving a comment, you get a freebie',
            choices: ['cake', 'fries'],
            /**
             * when: Controls whether this question is asked
             * - Receives all previous answers as parameter
             * - Return true to ask the question
             * - Return false to skip it
             * - In this case: only ask if user changed the default comment
             * - If skipped, 'prize' won't be present in the answers object
             */
            when(answers: { comments?: string }) {
                return answers.comments !== 'Nope, all good!';
            },
        },
    ]);

    /**
     * After all questions are answered, inquirer.prompt() returns
     * The 'answers' object contains all the user's responses
     * - Keys match the 'name' fields from each question
     * - Values are the actual answers (possibly transformed by 'filter')
     * - Optional questions (using 'when') may not be present
     */
    console.log('\nOrder receipt:');
    console.log(JSON.stringify(answers, null, '  '));
}

/**
 * Execute the main function
 * In a real application, you might want to handle command-line arguments
 * or export this function for use in other modules
 */
main();