from flask_restx import Api, Resource, fields, Namespace

# Lazy initialization - api_v1 will be imported when this module is imported
# This MUST be called BEFORE the blueprint is registered with the Flask app
# Flask-RESTX needs to add routes to the blueprint before registration
api = None
ns_auth = None
ns_records = None
ns_analytics = None
ns_export = None

def init_api():
    """Initialize the API object and namespaces - call this BEFORE blueprint is registered"""
    global api, ns_auth, ns_records, ns_analytics, ns_export
    
    if api is not None:
        return api
    
    try:
        from src.api.v1.routes import api_v1
        
        api = Api(
            api_v1,
            version='1.0',
            title='Blockendance API',
            description='Blockchain-based Attendance Management System API',
            doc='/docs',
            prefix='/api/v1'
        )
        
        # Create namespaces
        ns_auth = Namespace('auth', description='Authentication operations')
        ns_records = Namespace('records', description='Attendance records operations')
        ns_analytics = Namespace('analytics', description='Analytics operations')
        ns_export = Namespace('export', description='Export operations')
        
        # Add namespaces to API
        api.add_namespace(ns_auth)
        api.add_namespace(ns_records)
        api.add_namespace(ns_analytics)
        api.add_namespace(ns_export)
        
        # Define models and routes
        _define_models()
        _define_routes()
        
        return api
    except ImportError:
        return None

def _define_models():
    """Define API models"""
    global api
    
    if api is None:
        return
    
    # Models are defined inline in routes for simplicity
    pass

def _define_routes():
    """Define API routes"""
    global api, ns_auth, ns_records, ns_analytics, ns_export
    
    if api is None or ns_auth is None:
        return
    
    @ns_auth.route('/login')
    class Login(Resource):
        @ns_auth.doc('login')
        @ns_auth.marshal_with(api.model('LoginResponse', {
            'success': fields.Boolean(),
            'data': fields.Raw()
        }), code=200)
        @ns_auth.marshal_with(api.model('Error', {
            'error': fields.String(),
            'message': fields.String(),
            'status_code': fields.Integer()
        }), code=401)
        def post(self):
            """Authenticate user and get JWT token"""
            pass

    @ns_auth.route('/verify')
    class Verify(Resource):
        @ns_auth.doc('verify', security='Bearer')
        @ns_auth.marshal_with(api.model('VerifyResponse', {
            'success': fields.Boolean(),
            'data': fields.Raw()
        }), code=200)
        @ns_auth.marshal_with(api.model('Error', {
            'error': fields.String(),
            'message': fields.String(),
            'status_code': fields.Integer()
        }), code=401)
        def get(self):
            """Verify JWT token"""
            pass

    @ns_records.route('/records')
    class Records(Resource):
        @ns_records.doc('get_records', security='Bearer')
        @ns_records.param('page', 'Page number', type='integer', default=1)
        @ns_records.param('per_page', 'Items per page', type='integer', default=10)
        @ns_records.marshal_with(api.model('RecordsResponse', {
            'success': fields.Boolean(),
            'data': fields.Raw()
        }), code=200)
        def get(self):
            """Get paginated attendance records"""
            pass

    @ns_records.route('/stats')
    class Stats(Resource):
        @ns_records.doc('get_stats', security='Bearer')
        @ns_records.marshal_with(api.model('StatsResponse', {
            'success': fields.Boolean(),
            'data': fields.Raw()
        }), code=200)
        def get(self):
            """Get blockchain statistics"""
            pass

    @ns_analytics.route('/analytics')
    class Analytics(Resource):
        @ns_analytics.doc('get_analytics', security='Bearer')
        @ns_analytics.param('page', 'Page number', type='integer', default=1)
        @ns_analytics.param('per_page', 'Items per page', type='integer', default=50)
        @ns_analytics.marshal_with(api.model('AnalyticsResponse', {
            'success': fields.Boolean(),
            'data': fields.Raw()
        }), code=200)
        def get(self):
            """Get attendance analytics"""
            pass

    @ns_export.route('/export/<format>')
    class Export(Resource):
        @ns_export.doc('export_data', security='Bearer')
        @ns_export.param('format', 'Export format (csv, analytics, json)', enum=['csv', 'analytics', 'json'])
        @ns_export.marshal_with(api.model('ExportResponse', {
            'success': fields.Boolean(),
            'message': fields.String()
        }), code=200)
        def get(self, format):
            """Export blockchain data"""
            pass
