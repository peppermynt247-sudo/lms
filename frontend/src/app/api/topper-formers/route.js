

const url ='https://abc-api.edmingle.com/nuSource/api/v1/course/46/testanalytics/topperformers'
export async function Get(params) {
     
    const apikey = request.headers.get('X-API-Key');
    const class_id = request.headers.get('class_id');
    const batch_id = request.headers.get('batch_id');
  
    const configBatch = {
      headers: {
        apikey: apikey,
        ORGID: 3, 
      },
      params: {
        sort_order: 'D',
        class_id: batch_id,
        master_batch_id: batch_id,
        get_certificate_data: 1,
        course_class_id: class_id,
        page: 1, 
        per_page: 50,
      },
    };

    try {
        
    } catch (error) {
        
    }
}