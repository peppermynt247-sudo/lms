import axios from 'axios';
import { NextResponse } from 'next/server';

const url = 'https://abc-api.edmingle.com/nuSource/api/v1/masterbatch/classstudents';

export async function GET(request) {
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
    const response = await axios.get(url, configBatch);

    const totalProgress = response.data.students.reduce((sum, student) => {
        const progress = student.progress && Array.isArray(student.progress) && student.progress.length > 0 
            ? student.progress[0] 
            : 0;
        return sum + progress;
    }, 0);

  
    const averageProgress = Number((totalProgress / response.data.students.length).toFixed(2));

    return NextResponse.json(averageProgress, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the external API' },
      { status: 500 }
    );
  }
}