/**
 * @typedef {'pending' | 'active' | 'complete'} AnalysisStepStatus
 */

/**
 * @typedef {Object} AnalysisStep
 * @property {string} id
 * @property {string} label
 * @property {AnalysisStepStatus} status
 */

/**
 * @typedef {'idle' | 'analyzing' | 'complete' | 'error'} AppStatus
 */

/**
 * @typedef {Object} FileNode
 * @property {string} name
 * @property {'file' | 'folder'} type
 * @property {FileNode[]=} children
 * @property {boolean=} isEntry
 */

/**
 * @typedef {Object} SecurityIssue
 * @property {string} id
 * @property {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'} severity
 * @property {string} title
 * @property {string} location
 * @property {string} description
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user' | 'model'} role
 * @property {string} text
 * @property {boolean=} isTyping
 */

/**
 * @typedef {Object} DocItem
 * @property {string} id
 * @property {string} filename
 * @property {string=} content
 * @property {'idle' | 'loading' | 'complete'} status
 */
